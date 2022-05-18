import Repzo from "repzo";
import DataSet from "data-set-query";
import { EVENT, Config, CommandEvent, Result } from "../types";
import { _fetch, _create, _update, _delete } from "../util.js";
import { v4 as uuid } from "uuid";

interface QoyodProduct {
  id: number;
  name_ar: string;
  name_en: string;
  description?: string;
  category_id: number;
  type: "Product"; // "Product"| "Service"| "Expense"| "RawMaterial"| "Recipe";
  unit_type: number;
  unit: string;
  buying_price: string; // "850.0";
  selling_price: string; // "1000.0";
  sku: string;
  barcode?: string;
  is_sold: boolean;
  is_bought: boolean;
  inventories?: {
    id: number;
    name_en: string;
    name_ar: string;
    stock: string;
  }[];
  ingredients?: [];
  unit_conversions?: {
    to_unit: number;
    from_unit: number;
    rate: string;
    barcode?: string;
    unit_purchase_price?: string;
    unit_selling_price?: string;
  }[];
}

interface QoyodProducts {
  products: QoyodProduct[];
}

export const adjust_inventory = async (commandEvent: CommandEvent) => {
  try {
    console.log("adjust_inventory");
    const nameSpace = commandEvent.nameSpace.join("_");
    const result: Result = {
      qoyod_total: 0,
      repzo_total: 0,
      created: 0,
      updated: 0,
      failed: 0,
      failed_msg: [],
    };

    const qoyod_products: QoyodProducts = await get_qoyod_products(
      commandEvent.app.available_app.app_settings.serviceEndPoint,
      commandEvent.app.formData.serviceApiKey,
    );

    const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
      env: commandEvent.env,
    });
    const repzo_warehouses = await repzo.warehouse.find({
      per_page: 50000,
      disabled: false,
    });

    const repzo_variants = await repzo.variant.find({
      per_page: 50000,
      disabled: false,
    });

    const repzo_measureunits = await repzo.measureunit.find({
      per_page: 50000,
    });

    const qoyod_inventories: {
      [key: string]: {
        id: number;
        sku: string;
        unit_type: number;
        unit?: string;
        stock: string | number;
      }[];
    } = {};
    qoyod_products.products.forEach((qoyod_product) => {
      qoyod_product.inventories?.forEach((qoyod_product_inventory) => {
        qoyod_inventories[qoyod_product_inventory.id] =
          qoyod_inventories[qoyod_product_inventory.id] || [];
        qoyod_inventories[qoyod_product_inventory.id].push({
          id: qoyod_product.id,
          sku: qoyod_product.sku,
          unit_type: qoyod_product.unit_type,
          unit: qoyod_product.unit,
          stock: qoyod_product_inventory.stock,
        });
      });
    });

    for (let key in qoyod_inventories) {
      const qoyod_warehouse_id = key;
      const qoyod_inventory = qoyod_inventories[key];
      const repzo_warehouse = repzo_warehouses.data.find(
        (warehouse) =>
          warehouse.integration_meta?.qoyod_id == qoyod_warehouse_id,
      );
      if (!repzo_warehouse) {
        console.log(
          `Adjust Inventory Failed >> Warehouse with integration_meta.qoyod_id: ${qoyod_warehouse_id} was not found`,
        );
        result.failed++;
        continue;
      }
      const repzo_inventory = await repzo.inventory.find({
        warehouse_id: repzo_warehouse._id,
        per_page: 50000,
      });

      const variants: { variant: string; qty: number }[] = [];
      qoyod_inventory.forEach((qoyod_item) => {
        const repzo_variant = repzo_variants.data.find(
          (variant) => variant.integration_meta?.qoyod_id == qoyod_item.id,
        );
        if (!repzo_variant) {
          console.log(
            `Adjust Inventory Failed >> Variant with integration_meta.qoyod_id: ${qoyod_item.id} was not found`,
          );
          result.failed++;
          return;
        }

        const repzo_measureunit = repzo_measureunits.data.find(
          (unit) => unit.integration_meta?.qoyod_id == qoyod_item.unit_type,
        );
        if (!repzo_measureunit) {
          console.log(
            `Adjust Inventory Failed >> Measure Unit with integration_meta.qoyod_id: ${qoyod_item.unit_type} was not found`,
          );
          result.failed++;
          return;
        }

        const repzo_item = repzo_inventory.data.find(
          (item) => item.variant_id.toString() == repzo_variant._id.toString(),
        );

        const qoyod_item_stock = Number(qoyod_item.stock);
        const qoyod_qty = repzo_measureunit.factor * qoyod_item_stock;

        const diff_qty = repzo_item ? qoyod_qty - repzo_item.qty : qoyod_qty;

        if (diff_qty)
          variants.push({ variant: repzo_variant._id, qty: diff_qty });
      });

      const data = {
        time: Date.now(),
        sync_id: uuid(),
        to: repzo_warehouse._id,
        variants: variants,
      };

      console.log(data);
      if (!data.variants.length) continue;
      const adjust_inventory_res = await repzo.adjustInventory.create(data);
      result.created++;
    }

    console.log(result);
    return result;
  } catch (e: any) {
    //@ts-ignore
    console.error(e?.response?.data);
    throw e?.response;
  }
};

const get_qoyod_products = async (
  serviceEndPoint: string,
  serviceApiKey: string,
  query?: string,
): Promise<QoyodProducts> => {
  try {
    const qoyod_products: QoyodProducts = await _fetch(
      serviceEndPoint,
      `/products${query ? query : ""}`,
      { "API-KEY": serviceApiKey },
    );
    return qoyod_products;
  } catch (e: any) {
    if (
      // code instead of msg
      e.response.data ==
      "We could not retrieve your products, we found nothing."
    )
      return { products: [] };

    throw e;
  }
};
