import Repzo from "repzo";
import DataSet from "data-set-query";
import {
  EVENT,
  Config,
  CommandEvent,
  Result,
  FailedDocsReport,
} from "../types";
import {
  _fetch,
  _create,
  _update,
  _delete,
  update_bench_time,
  updateAt_query,
  set_error,
} from "../util.js";

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
  is_inclusive: boolean;
  buying_price: string; // "850.0";
  selling_price: string; // "1000.0";
  sku: string;
  barcode?: string;
  is_sold: boolean;
  is_bought: boolean;
  track_quantity: boolean;
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

export interface QoyodProducts {
  products: QoyodProduct[];
}

export const addProducts = async (commandEvent: CommandEvent) => {
  const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
    env: commandEvent.env,
  });
  const commandLog = new Repzo.CommandLog(
    repzo,
    commandEvent.app,
    commandEvent.command
  );
  try {
    console.log("addProducts");

    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_product";

    await commandLog.load(commandEvent.sync_id);
    await commandLog
      .addDetail("Repzo Qoyod: Started Syncing Products")
      .commit();

    const nameSpace = commandEvent.nameSpace.join("_");
    const result: Result = {
      qoyod_total: 0,
      repzo_total: 0,
      created: 0,
      updated: 0,
      failed: 0,
    };
    const failed_docs_report: FailedDocsReport = [];

    const qoyod_products: QoyodProducts = await get_qoyod_products(
      commandEvent.app.available_app.app_settings.serviceEndPoint,
      commandEvent.app.formData.serviceApiKey,
      updateAt_query("", commandEvent.app.options_formData, bench_time_key)
    );
    result.qoyod_total = qoyod_products?.products?.length;
    await commandLog
      .addDetail(
        `${qoyod_products?.products?.length} products changed since ${
          commandEvent.app.options_formData[bench_time_key] || "ever"
        }`
      )
      .commit();

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
      is_inclusive: true,
      track_quantity: true,
      // is_sold: true,
      // is_bought: true,
      // inventories: true, // ??????
      // ingredients: true, // ??????
      // unit_conversions: true, // ??????
    });
    db.load(qoyod_products?.products);
    const product_query = qoyod_products?.products.map(
      (product: QoyodProduct) => `${nameSpace}_${product.id}`
    ); // ??

    const repzo_products = await repzo.product.find({
      "integration_meta.id": product_query,
      withVariants: true,
      per_page: 50000,
    });
    result.repzo_total = repzo_products?.data?.length;
    await commandLog
      .addDetail(
        `${repzo_products?.data?.length} products in Repzo was matched the integration.id`
      )
      .commit();

    const repzo_categories = await repzo.category.find({ per_page: 50000 });
    await commandLog
      .addDetail(`${repzo_categories?.data?.length} product categories`)
      .commit();
    const repzo_measureunits = await repzo.measureunit.find({
      per_page: 50000,
    });
    await commandLog
      .addDetail(`${repzo_measureunits?.data?.length} measure units`)
      .commit();
    const repzo_taxes = await repzo.tax.find({ per_page: 50000 });
    await commandLog.addDetail(`${repzo_taxes?.data?.length} taxes`).commit();
    const repzo_measureunit_family = await repzo.measureunitFamily.find({
      per_page: 50000,
    });
    await commandLog
      .addDetail(
        `${repzo_measureunit_family?.data?.length} measure unit families`
      )
      .commit();

    for (let i = 0; i < qoyod_products.products.length; i++) {
      const qoyod_product: QoyodProduct = qoyod_products.products[i];
      const repzo_product = repzo_products.data.find(
        (r_product) =>
          r_product.integration_meta?.id == `${nameSpace}_${qoyod_product.id}`
      );

      const price: number = qoyod_product.selling_price
        ? Number(qoyod_product.selling_price) * 1000
        : qoyod_product.buying_price
        ? Number(qoyod_product.buying_price) * 1000
        : 0;

      const category = repzo_categories.data.find(
        (cate) =>
          cate.integration_meta?.id ==
          `${nameSpace}_${qoyod_product.category_id}`
      );
      if (!category) {
        console.log(
          `Update product Failed >> Category with integration_meta.id: ${nameSpace}_${qoyod_product.category_id} was not found`
        );
        failed_docs_report.push({
          method: "fetchingData",
          doc: {
            repzo_product: repzo_product?._id,
            repzo_product_name: repzo_product?.name,
            qoyod_product: qoyod_product?.id,
            qoyod_product_name: qoyod_product?.name_ar,
          },
          error_message: `Update product Failed >> Category with integration_meta.id: ${nameSpace}_${qoyod_product.category_id} was not found`,
        });
        result.failed++;
        continue;
      }

      const measureunit = repzo_measureunits.data.find(
        (unit) =>
          unit.integration_meta?.id ==
          `${nameSpace}_${qoyod_product.unit_type}_1.0`
      );
      if (!measureunit) {
        console.log(
          `Update product Failed >> MeasureUnit with integration_meta.id: ${nameSpace}_${qoyod_product.unit_type} was not found`
        );
        failed_docs_report.push({
          method: "fetchingData",
          doc: {
            repzo_product: repzo_product?._id,
            repzo_product_name: repzo_product?.name,
            qoyod_product: qoyod_product?.id,
            qoyod_product_name: qoyod_product?.name_ar,
          },
          error_message: `Update product Failed >> MeasureUnit with integration_meta.id: ${nameSpace}_${qoyod_product.unit_type} was not found`,
        });
        result.failed++;
        continue;
      }

      const measureunit_family = repzo_measureunit_family.data.find(
        (unit) =>
          unit.integration_meta?.id == `${nameSpace}_${qoyod_product.sku}`
      );
      if (!measureunit_family) {
        console.log(
          `Update product Failed >> MeasureUnit Family with integration_meta.id: ${nameSpace}_${qoyod_product.sku} was not found`
        );
        failed_docs_report.push({
          method: "fetchingData",
          doc: {
            repzo_product: repzo_product?._id,
            repzo_product_name: repzo_product?.name,
            qoyod_product: qoyod_product?.id,
            qoyod_product_name: qoyod_product?.name_ar,
          },
          error_message: `Update product Failed >> MeasureUnit Family with integration_meta.id: ${nameSpace}_${qoyod_product.sku} was not found`,
        });
        result.failed++;
        continue;
      }

      const tax = repzo_taxes.data.find(
        (cate) =>
          cate.integration_meta?.id ==
          `${nameSpace}_${qoyod_product.tax_id}_${
            qoyod_product.is_inclusive ? "inclusive" : "additive"
          }`
      );
      if (!tax) {
        console.log(
          `Update product Failed >> Tax with integration_meta.id: ${nameSpace}_${
            qoyod_product.tax_id
          }_${
            qoyod_product.is_inclusive ? "inclusive" : "additive"
          } was not found`
        );
        failed_docs_report.push({
          method: "fetchingData",
          doc: {
            repzo_product: repzo_product?._id,
            repzo_product_name: repzo_product?.name,
            qoyod_product: qoyod_product?.id,
            qoyod_product_name: qoyod_product?.name_ar,
          },
          error_message: `Update product Failed >> Tax with integration_meta.id: ${nameSpace}_${
            qoyod_product.tax_id
          }_${
            qoyod_product.is_inclusive ? "inclusive" : "additive"
          } was not found`,
        });
        result.failed++;
        continue;
      }

      const repzo_variant = repzo_product?.variants?.find(
        (variant) =>
          variant.integration_meta?.id == `${nameSpace}_${qoyod_product.id}`
      );

      const body = {
        _id: repzo_product?._id,
        name: qoyod_product.name_en || qoyod_product.name_ar,
        local_name: qoyod_product.name_ar,
        sku: qoyod_product.sku,
        category: category._id,
        barcode: qoyod_product.barcode,
        sv_measureUnit: measureunit._id,
        description: qoyod_product.description,
        sv_tax: tax._id, // qoyod_product.tax_id,
        // product_img: qoyod_product.,
        measureunit_family: measureunit_family._id,
        active: true,
        frozen_pre_sales: !qoyod_product.track_quantity,
        frozen_sales: !qoyod_product.track_quantity,
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
          is_inclusive: qoyod_product.is_inclusive,
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
          console.log("Create product Failed >> ", e?.response, body);
          failed_docs_report.push({
            method: "create",
            doc: body,
            error_message: set_error(e),
          });
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
          is_inclusive: repzo_product.integration_meta?.is_inclusive,
          track_quantity: !(
            repzo_product.frozen_pre_sales || repzo_product.frozen_sales
          ),
        });
        if (found_identical_docs.length) continue;
        // Update
        try {
          const updated_product = await repzo.product.update(
            repzo_product._id,
            body
          );
          result.updated++;
        } catch (e: any) {
          console.log("Update product Failed >> ", e, body);
          failed_docs_report.push({
            method: "update",
            doc_id: repzo_product?._id,
            doc: body,
            error_message: set_error(e),
          });
          result.failed++;
        }
      }
    }

    // console.log(result);

    await update_bench_time(
      repzo,
      commandEvent.app._id,
      bench_time_key,
      new_bench_time
    );
    await commandLog
      .setStatus(
        "success",
        failed_docs_report.length ? failed_docs_report : null
      )
      .setBody(result)
      .commit();
    return result;
  } catch (e: any) {
    //@ts-ignore
    console.error(e?.response?.data || e);
    await commandLog.setStatus("fail", e).commit();
    throw e;
  }
};

export const get_qoyod_products = async (
  serviceEndPoint: string,
  serviceApiKey: string,
  query?: string
): Promise<QoyodProducts> => {
  try {
    const qoyod_products: QoyodProducts = await _fetch(
      serviceEndPoint,
      `/products${query ? query : ""}`,
      { "API-KEY": serviceApiKey }
    );
    if (!qoyod_products.hasOwnProperty("products"))
      qoyod_products.products = [];
    return qoyod_products;
  } catch (e: any) {
    if (e.response.status == 404) return { products: [] };
    throw e;
  }
};
