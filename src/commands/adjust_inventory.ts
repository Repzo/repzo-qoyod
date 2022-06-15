import Repzo from "repzo";
import { CommandEvent, Result } from "../types";
import { _fetch, _create, _update, _delete } from "../util.js";
import { v4 as uuid } from "uuid";
import { QoyodProducts, get_qoyod_products } from "./product.js";

export const adjust_inventory = async (commandEvent: CommandEvent) => {
  const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
    env: commandEvent.env,
  });
  const commandLog = new Repzo.CommandLog(
    repzo,
    commandEvent.app,
    commandEvent.command
  );
  try {
    await commandLog.load(commandEvent.sync_id);
    await commandLog
      .addDetail("Repzo Qoyod: Started Syncing Product Categories")
      .commit();

    const nameSpace = commandEvent.nameSpace.join("_");
    console.log(nameSpace, " adjust_inventory");
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
      commandEvent.app.formData.serviceApiKey
    );
    commandLog.addDetail(
      `${qoyod_products.products?.length} Products in Qoyod`
    );

    const repzo_warehouses = await repzo.warehouse.find({
      per_page: 50000,
    });
    commandLog.addDetail(
      `${repzo_warehouses?.data?.length} Warehouses in Repzo`
    );

    const repzo_variants = await repzo.variant.find({
      per_page: 50000,
      withProduct: true,
    });
    commandLog.addDetail(`${repzo_variants?.data?.length} Variants in Repzo`);

    const repzo_measureunits = await repzo.measureunit.find({
      per_page: 50000,
    });
    commandLog.addDetail(
      `${repzo_measureunits?.data?.length} Measure units Warehouses in Repzo`
    );

    const repzo_inventory = await repzo.inventory.find({
      per_page: 50000,
      export_behaviour: true,
    });
    commandLog.addDetail(
      `${repzo_inventory?.data?.length} variants in all inventories on Repzo`
    );

    await commandLog.commit();

    const master_warehouse_product: {
      [qoyodWarehouseId_qoyodProductId: string]: {
        qoyod_warehouse_id: number;
        repzo_warehouse_id: string;
        qoyod_product_id: number;
        repzo_variant_id: string;
        qoyod_qty: number;
        repzo_qty: number;
      };
    } = {};

    qoyod_products?.products?.forEach((qoyod_product) => {
      qoyod_product.inventories?.forEach((qoyod_product_inventory) => {
        const qoyod_warehouse_id = qoyod_product_inventory.id;
        const qoyod_product_id = qoyod_product.id;
        const qoyod_qty = Number(qoyod_product_inventory.stock);

        const repzo_warehouse = repzo_warehouses?.data?.find(
          (warehouse) =>
            warehouse?.integration_meta?.qoyod_id?.toString() ==
            qoyod_warehouse_id?.toString()
        );

        if (!repzo_warehouse) {
          console.log(
            `Adjust Inventory Failed >> Warehouse with integration_meta.qoyod_id: ${qoyod_warehouse_id} was not found`
          );
          result.failed_msg.push(
            `Adjust Inventory Failed >> Warehouse with integration_meta.qoyod_id: ${qoyod_warehouse_id} was not found`
          );
          result.failed++;
          return;
        }

        const repzo_variant = repzo_variants?.data?.find(
          (variant) =>
            variant?.integration_meta?.qoyod_id?.toString() ==
            qoyod_product_id?.toString()
        );

        if (!repzo_variant) {
          console.log(
            `Adjust Inventory Failed >> Variant with integration_meta.qoyod_id: ${qoyod_product_id} was not found`
          );
          result.failed_msg.push(
            `Adjust Inventory Failed >> Variant with integration_meta.qoyod_id: ${qoyod_product_id} was not found`
          );
          result.failed++;
          return;
        }

        master_warehouse_product[`${qoyod_warehouse_id}_${qoyod_product_id}`] =
          {
            qoyod_warehouse_id,
            qoyod_product_id,
            qoyod_qty,
            repzo_warehouse_id: repzo_warehouse?._id,
            repzo_variant_id: repzo_variant?._id,
            repzo_qty: 0,
          };
      });
    });

    repzo_inventory?.data?.forEach((repzo_product_inventory) => {
      const repzo_warehouse_id = repzo_product_inventory.warehouse_id;
      const repzo_variant_id = repzo_product_inventory.variant_id;
      const repzo_qty = repzo_product_inventory.qty;
      const qoyod_product_id = Number(repzo_product_inventory.variant_name);

      const repzo_warehouse = repzo_warehouses?.data?.find(
        (warehouse) => warehouse._id.toString() == repzo_warehouse_id.toString()
      );
      if (!repzo_warehouse) {
        console.log(
          `Adjust Inventory Failed >> Warehouse with integration_meta.repzo_id: ${repzo_warehouse_id} was not found`
        );
        result.failed_msg.push(
          `Adjust Inventory Failed >> Warehouse with integration_meta.repzo_id: ${repzo_warehouse_id} was not found`
        );
        result.failed++;
        return;
      }

      const qoyod_warehouse_id = repzo_warehouse.integration_meta?.qoyod_id;

      const master_key = `${qoyod_warehouse_id}_${repzo_variant_id}`;

      if (master_warehouse_product[master_key]) {
        master_warehouse_product[master_key].repzo_qty = repzo_qty;
        master_warehouse_product[master_key].repzo_warehouse_id =
          repzo_warehouse_id;
        master_warehouse_product[master_key].repzo_variant_id =
          repzo_variant_id;
      } else {
        master_warehouse_product[master_key] = {
          qoyod_warehouse_id,
          qoyod_product_id,
          qoyod_qty: 0,
          repzo_warehouse_id,
          repzo_variant_id,
          repzo_qty,
        };
      }
    });

    const adjust_repzo_inventory: {
      [repzo_inventory_id: string]: { variant: string; qty: number }[];
    } = {};

    Object.values(master_warehouse_product).forEach((warehouse_product) => {
      const diff_qty =
        warehouse_product.qoyod_qty - warehouse_product.repzo_qty;

      if (diff_qty) {
        if (!adjust_repzo_inventory[warehouse_product.repzo_warehouse_id])
          adjust_repzo_inventory[warehouse_product.repzo_warehouse_id] = [];

        adjust_repzo_inventory[warehouse_product.repzo_warehouse_id].push({
          variant: warehouse_product.repzo_variant_id,
          qty: diff_qty,
        });
      }
    });

    for (let key in adjust_repzo_inventory) {
      const data = {
        time: Date.now(),
        sync_id: uuid(),
        to: key,
        variants: adjust_repzo_inventory[key],
      };

      // console.log(data);
      if (!data.variants.length) continue;
      const adjust_inventory_res = await repzo.adjustInventory.create(data);
      result.created++;
    }

    // console.log(result);
    await commandLog.setStatus("success").setBody(result).commit();
    return result;
  } catch (e: any) {
    //@ts-ignore
    console.error(e?.response?.data);
    await commandLog.setStatus("fail", e).commit();
    throw e?.response;
  }
};
