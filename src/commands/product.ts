import Repzo from "repzo";
import DataSet from "data-set-query";
import { EVENT, Config, CommandEvent } from "../types";
import { _fetch, _create, _update, _delete } from "../util.js";

interface QoyodProduct {
  id: number;
  name_ar: string;
  name_en: string;
  description?: string;
  category_id: number;
  type: "Product"; // "Product"| "Service"| "Expense"| "RawMaterial"| "Recipe";
  unit_type: number;
  unit: string;
  tax_id: number;
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

export const addProducts = async (commandEvent: CommandEvent) => {
  try {
    console.log("addProducts");
    const nameSpace = commandEvent.nameSpace.join("_");
    const result = {
      qoyod_total: 0,
      repzo_total: 0,
      created: 0,
      updated: 0,
      failed: 0,
    };
    const qoyod_products: QoyodProducts = await get_qoyod_products(
      commandEvent.app.available_app.app_settings.serviceEndPoint,
      commandEvent.app.formData.serviceApiKey,
    );
    result.qoyod_total = qoyod_products?.products?.length;
    const db = new DataSet([], { autoIndex: false });
    db.createIndex({
      id: true,
      name_ar: true,
      name_en: true,
      description: true,
      category_id: true,
      type: true,
      unit_type: true,
      unit: true,
      buying_price: true,
      selling_price: true,
      sku: true,
      barcode: true,
      tax_id: true,
      // is_sold: true,
      // is_bought: true,
      // inventories: true, // ??????
      // ingredients: true, // ??????
      // unit_conversions: true, // ??????
    });
    db.load(qoyod_products?.products);
    const product_query = qoyod_products?.products.map(
      (product: QoyodProduct) => `${nameSpace}_${product.id}`,
    ); // ??
    const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
      env: commandEvent.env,
    });
    const repzo_products = await repzo.product.find({
      "integration_meta.id": product_query,
      withVariants: true,
    });
    result.repzo_total = repzo_products?.data?.length;

    const repzo_categories = await repzo.category.find({ per_page: 50000 });
    const repzo_measureunits = await repzo.measureunit.find({
      per_page: 50000,
    });
    const repzo_taxes = await repzo.tax.find({ per_page: 50000 });

    for (let i = 0; i < qoyod_products.products.length; i++) {
      const qoyod_product: QoyodProduct = qoyod_products.products[i];
      const repzo_product = repzo_products.data.find(
        (r_product) =>
          r_product.integration_meta?.id == `${nameSpace}_${qoyod_product.id}`,
      );

      const price: number = qoyod_product.selling_price
        ? Number(qoyod_product.selling_price) * 1000
        : qoyod_product.buying_price
        ? Number(qoyod_product.buying_price) * 1000
        : 0;

      const category = repzo_categories.data.find(
        (cate) =>
          cate.integration_meta?.id ==
          `${nameSpace}_${qoyod_product.category_id}`,
      );
      if (!category) {
        console.log(
          `Update product Failed >> Category with integration_meta.id: ${nameSpace}_${qoyod_product.category_id} was not found`,
        );
        result.failed++;
        continue;
      }

      const measureunit = repzo_measureunits.data.find(
        (unit) =>
          unit.integration_meta?.id ==
          `${nameSpace}_${qoyod_product.unit_type}`,
      );
      if (!measureunit) {
        console.log(
          `Update product Failed >> MeasureUnit with integration_meta.id: ${nameSpace}_${qoyod_product.unit_type} was not found`,
        );
        result.failed++;
        continue;
      }

      const tax = repzo_taxes.data.find(
        (cate) =>
          cate.integration_meta?.id == `${nameSpace}_${qoyod_product.tax_id}`,
      );
      if (!tax) {
        console.log(
          `Update product Failed >> Tax with integration_meta.id: ${nameSpace}_${qoyod_product.tax_id} was not found`,
        );
        result.failed++;
        continue;
      }

      const repzo_variant = repzo_product?.variants?.find(
        (variant) =>
          variant.integration_meta?.id == `${nameSpace}_${qoyod_product.id}`,
      );

      const body = {
        _id: repzo_product?._id,
        name: qoyod_product.name_en,
        local_name: qoyod_product.name_ar,
        sku: qoyod_product.sku,
        category: category._id,
        barcode: qoyod_product.barcode,
        sv_measureUnit: measureunit._id,
        description: qoyod_product.description,
        sv_tax: tax._id, // qoyod_product.tax_id,
        // product_img: qoyod_product.,
        // measureunit_family: ,
        active: true,
        rsp: Math.round(price),
        integration_meta: {
          id: `${nameSpace}_${qoyod_product.id}`,
          qoyod_id: qoyod_product.id,
          category_id: qoyod_product.category_id,
          unit: qoyod_product.unit,
          type: qoyod_product.type,
          unit_type: qoyod_product.unit_type,
          buying_price: qoyod_product.buying_price,
          selling_price: qoyod_product.selling_price,
          tax_id: qoyod_product.tax_id,
        },
        variants: [
          {
            _id: repzo_variant?._id,
            product: repzo_product?._id,
            disabled: false,
            name: qoyod_product.sku,
            price: Math.round(price),
            integration_meta: {
              id: `${nameSpace}_${qoyod_product.id}`,
              qoyod_id: qoyod_product.id,
            },
          },
        ],
      };
      if (!repzo_product) {
        // Create
        try {
          const created_product = await repzo.product.create(body);
          result.created++;
        } catch (e: any) {
          console.log("Create product Failed >> ", e.response, body);
          result.failed++;
        }
      } else {
        const found_identical_docs = db.search({
          id: repzo_product.integration_meta?.qoyod_id,
          name_ar: repzo_product.local_name,
          name_en: repzo_product.name,
          description: repzo_product.description,
          category_id: repzo_product.integration_meta?.category_id,
          type: repzo_product.integration_meta?.type,
          unit_type: repzo_product.integration_meta?.unit_type,
          unit: repzo_product.integration_meta?.unit,
          buying_price: repzo_product.integration_meta?.buying_price,
          selling_price: repzo_product.integration_meta?.selling_price,
          sku: repzo_product.sku,
          barcode: repzo_product.barcode,
          tax_id: repzo_product.integration_meta?.tax_id,
        });
        if (found_identical_docs.length) continue;
        // Update
        try {
          const updated_product = await repzo.product.update(
            repzo_product._id,
            body,
          );
          result.updated++;
        } catch (e) {
          console.log("Update product Failed >> ", e, body);
          result.failed++;
        }
      }
    }
    console.log(result);
    return result;
  } catch (e: any) {
    //@ts-ignore
    console.error(e.response.data);
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
