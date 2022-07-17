import Repzo from "repzo";
import DataSet from "data-set-query";
import {
  _fetch,
  update_bench_time,
  updateAt_query,
  set_error,
} from "../util.js";
export const addProducts = async (commandEvent) => {
  var _a,
    _b,
    _c,
    _d,
    _e,
    _f,
    _g,
    _h,
    _j,
    _k,
    _l,
    _m,
    _o,
    _p,
    _q,
    _r,
    _s,
    _t,
    _u,
    _v;
  const repzo = new Repzo(
    (_a = commandEvent.app.formData) === null || _a === void 0
      ? void 0
      : _a.repzoApiKey,
    {
      env: commandEvent.env,
    }
  );
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
    const result = {
      qoyod_total: 0,
      repzo_total: 0,
      created: 0,
      updated: 0,
      failed: 0,
    };
    const failed_docs_report = [];
    const qoyod_products = await get_qoyod_products(
      commandEvent.app.available_app.app_settings.serviceEndPoint,
      commandEvent.app.formData.serviceApiKey,
      updateAt_query("", commandEvent.app.options_formData, bench_time_key)
    );
    result.qoyod_total =
      (_b =
        qoyod_products === null || qoyod_products === void 0
          ? void 0
          : qoyod_products.products) === null || _b === void 0
        ? void 0
        : _b.length;
    await commandLog
      .addDetail(
        `${
          (_c =
            qoyod_products === null || qoyod_products === void 0
              ? void 0
              : qoyod_products.products) === null || _c === void 0
            ? void 0
            : _c.length
        } products changed since ${
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
    db.load(
      qoyod_products === null || qoyod_products === void 0
        ? void 0
        : qoyod_products.products
    );
    const product_query =
      qoyod_products === null || qoyod_products === void 0
        ? void 0
        : qoyod_products.products.map(
            (product) => `${nameSpace}_${product.id}`
          ); // ??
    const repzo_products = await repzo.product.find({
      "integration_meta.id": product_query,
      withVariants: true,
      per_page: 50000,
    });
    result.repzo_total =
      (_d =
        repzo_products === null || repzo_products === void 0
          ? void 0
          : repzo_products.data) === null || _d === void 0
        ? void 0
        : _d.length;
    await commandLog
      .addDetail(
        `${
          (_e =
            repzo_products === null || repzo_products === void 0
              ? void 0
              : repzo_products.data) === null || _e === void 0
            ? void 0
            : _e.length
        } products in Repzo was matched the integration.id`
      )
      .commit();
    const repzo_categories = await repzo.category.find({ per_page: 50000 });
    await commandLog
      .addDetail(
        `${
          (_f =
            repzo_categories === null || repzo_categories === void 0
              ? void 0
              : repzo_categories.data) === null || _f === void 0
            ? void 0
            : _f.length
        } product categories`
      )
      .commit();
    const repzo_measureunits = await repzo.measureunit.find({
      per_page: 50000,
    });
    await commandLog
      .addDetail(
        `${
          (_g =
            repzo_measureunits === null || repzo_measureunits === void 0
              ? void 0
              : repzo_measureunits.data) === null || _g === void 0
            ? void 0
            : _g.length
        } measure units`
      )
      .commit();
    const repzo_taxes = await repzo.tax.find({ per_page: 50000 });
    await commandLog
      .addDetail(
        `${
          (_h =
            repzo_taxes === null || repzo_taxes === void 0
              ? void 0
              : repzo_taxes.data) === null || _h === void 0
            ? void 0
            : _h.length
        } taxes`
      )
      .commit();
    const repzo_measureunit_family = await repzo.measureunitFamily.find({
      per_page: 50000,
    });
    await commandLog
      .addDetail(
        `${
          (_j =
            repzo_measureunit_family === null ||
            repzo_measureunit_family === void 0
              ? void 0
              : repzo_measureunit_family.data) === null || _j === void 0
            ? void 0
            : _j.length
        } measure unit families`
      )
      .commit();
    for (let i = 0; i < qoyod_products.products.length; i++) {
      const qoyod_product = qoyod_products.products[i];
      const repzo_product = repzo_products.data.find((r_product) => {
        var _a;
        return (
          ((_a = r_product.integration_meta) === null || _a === void 0
            ? void 0
            : _a.id) == `${nameSpace}_${qoyod_product.id}`
        );
      });
      const price = qoyod_product.selling_price
        ? Number(qoyod_product.selling_price) * 1000
        : qoyod_product.buying_price
        ? Number(qoyod_product.buying_price) * 1000
        : 0;
      const category = repzo_categories.data.find((cate) => {
        var _a;
        return (
          ((_a = cate.integration_meta) === null || _a === void 0
            ? void 0
            : _a.id) == `${nameSpace}_${qoyod_product.category_id}`
        );
      });
      if (!category) {
        console.log(
          `Update product Failed >> Category with integration_meta.id: ${nameSpace}_${qoyod_product.category_id} was not found`
        );
        failed_docs_report.push({
          method: "fetchingData",
          doc: {
            repzo_product:
              repzo_product === null || repzo_product === void 0
                ? void 0
                : repzo_product._id,
            repzo_product_name:
              repzo_product === null || repzo_product === void 0
                ? void 0
                : repzo_product.name,
            qoyod_product:
              qoyod_product === null || qoyod_product === void 0
                ? void 0
                : qoyod_product.id,
            qoyod_product_name:
              qoyod_product === null || qoyod_product === void 0
                ? void 0
                : qoyod_product.name_ar,
          },
          error_message: `Update product Failed >> Category with integration_meta.id: ${nameSpace}_${qoyod_product.category_id} was not found`,
        });
        result.failed++;
        continue;
      }
      const measureunit = repzo_measureunits.data.find((unit) => {
        var _a;
        return (
          ((_a = unit.integration_meta) === null || _a === void 0
            ? void 0
            : _a.id) == `${nameSpace}_${qoyod_product.unit_type}_1.0`
        );
      });
      if (!measureunit) {
        console.log(
          `Update product Failed >> MeasureUnit with integration_meta.id: ${nameSpace}_${qoyod_product.unit_type} was not found`
        );
        failed_docs_report.push({
          method: "fetchingData",
          doc: {
            repzo_product:
              repzo_product === null || repzo_product === void 0
                ? void 0
                : repzo_product._id,
            repzo_product_name:
              repzo_product === null || repzo_product === void 0
                ? void 0
                : repzo_product.name,
            qoyod_product:
              qoyod_product === null || qoyod_product === void 0
                ? void 0
                : qoyod_product.id,
            qoyod_product_name:
              qoyod_product === null || qoyod_product === void 0
                ? void 0
                : qoyod_product.name_ar,
          },
          error_message: `Update product Failed >> MeasureUnit with integration_meta.id: ${nameSpace}_${qoyod_product.unit_type} was not found`,
        });
        result.failed++;
        continue;
      }
      const measureunit_family = repzo_measureunit_family.data.find((unit) => {
        var _a;
        return (
          ((_a = unit.integration_meta) === null || _a === void 0
            ? void 0
            : _a.id) == `${nameSpace}_${qoyod_product.sku}`
        );
      });
      if (!measureunit_family) {
        console.log(
          `Update product Failed >> MeasureUnit Family with integration_meta.id: ${nameSpace}_${qoyod_product.sku} was not found`
        );
        failed_docs_report.push({
          method: "fetchingData",
          doc: {
            repzo_product:
              repzo_product === null || repzo_product === void 0
                ? void 0
                : repzo_product._id,
            repzo_product_name:
              repzo_product === null || repzo_product === void 0
                ? void 0
                : repzo_product.name,
            qoyod_product:
              qoyod_product === null || qoyod_product === void 0
                ? void 0
                : qoyod_product.id,
            qoyod_product_name:
              qoyod_product === null || qoyod_product === void 0
                ? void 0
                : qoyod_product.name_ar,
          },
          error_message: `Update product Failed >> MeasureUnit Family with integration_meta.id: ${nameSpace}_${qoyod_product.sku} was not found`,
        });
        result.failed++;
        continue;
      }
      const tax = repzo_taxes.data.find((cate) => {
        var _a;
        return (
          ((_a = cate.integration_meta) === null || _a === void 0
            ? void 0
            : _a.id) ==
          `${nameSpace}_${qoyod_product.tax_id}_${
            qoyod_product.is_inclusive ? "inclusive" : "additive"
          }`
        );
      });
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
            repzo_product:
              repzo_product === null || repzo_product === void 0
                ? void 0
                : repzo_product._id,
            repzo_product_name:
              repzo_product === null || repzo_product === void 0
                ? void 0
                : repzo_product.name,
            qoyod_product:
              qoyod_product === null || qoyod_product === void 0
                ? void 0
                : qoyod_product.id,
            qoyod_product_name:
              qoyod_product === null || qoyod_product === void 0
                ? void 0
                : qoyod_product.name_ar,
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
      const repzo_variant =
        (_k =
          repzo_product === null || repzo_product === void 0
            ? void 0
            : repzo_product.variants) === null || _k === void 0
          ? void 0
          : _k.find((variant) => {
              var _a;
              return (
                ((_a = variant.integration_meta) === null || _a === void 0
                  ? void 0
                  : _a.id) == `${nameSpace}_${qoyod_product.id}`
              );
            });
      const body = {
        _id:
          repzo_product === null || repzo_product === void 0
            ? void 0
            : repzo_product._id,
        name: qoyod_product.name_en || qoyod_product.name_ar,
        local_name: qoyod_product.name_ar,
        sku: qoyod_product.sku,
        category: category._id,
        barcode: qoyod_product.barcode,
        sv_measureUnit: measureunit._id,
        description: qoyod_product.description,
        sv_tax: tax._id,
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
            _id:
              repzo_variant === null || repzo_variant === void 0
                ? void 0
                : repzo_variant._id,
            product:
              repzo_product === null || repzo_product === void 0
                ? void 0
                : repzo_product._id,
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
        } catch (e) {
          console.log(
            "Create product Failed >> ",
            e === null || e === void 0 ? void 0 : e.response,
            body
          );
          failed_docs_report.push({
            method: "create",
            doc: body,
            error_message: set_error(e),
          });
          result.failed++;
        }
      } else {
        const found_identical_docs = db.search({
          id:
            (_l = repzo_product.integration_meta) === null || _l === void 0
              ? void 0
              : _l.qoyod_id,
          name_ar: repzo_product.local_name,
          name_en: repzo_product.name,
          description: repzo_product.description,
          category_id:
            (_m = repzo_product.integration_meta) === null || _m === void 0
              ? void 0
              : _m.category_id,
          type:
            (_o = repzo_product.integration_meta) === null || _o === void 0
              ? void 0
              : _o.type,
          unit_type:
            (_p = repzo_product.integration_meta) === null || _p === void 0
              ? void 0
              : _p.unit_type,
          unit:
            (_q = repzo_product.integration_meta) === null || _q === void 0
              ? void 0
              : _q.unit,
          buying_price:
            (_r = repzo_product.integration_meta) === null || _r === void 0
              ? void 0
              : _r.buying_price,
          selling_price:
            (_s = repzo_product.integration_meta) === null || _s === void 0
              ? void 0
              : _s.selling_price,
          sku: repzo_product.sku,
          barcode: repzo_product.barcode,
          tax_id:
            (_t = repzo_product.integration_meta) === null || _t === void 0
              ? void 0
              : _t.tax_id,
          is_inclusive:
            (_u = repzo_product.integration_meta) === null || _u === void 0
              ? void 0
              : _u.is_inclusive,
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
        } catch (e) {
          console.log("Update product Failed >> ", e, body);
          failed_docs_report.push({
            method: "update",
            doc_id:
              repzo_product === null || repzo_product === void 0
                ? void 0
                : repzo_product._id,
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
  } catch (e) {
    //@ts-ignore
    console.error(
      ((_v = e === null || e === void 0 ? void 0 : e.response) === null ||
      _v === void 0
        ? void 0
        : _v.data) || e
    );
    await commandLog.setStatus("fail", e).commit();
    throw e;
  }
};
export const get_qoyod_products = async (
  serviceEndPoint,
  serviceApiKey,
  query
) => {
  try {
    const qoyod_products = await _fetch(
      serviceEndPoint,
      `/products${query ? query : ""}`,
      { "API-KEY": serviceApiKey }
    );
    if (!qoyod_products.hasOwnProperty("products"))
      qoyod_products.products = [];
    return qoyod_products;
  } catch (e) {
    if (e.response.status == 404) return { products: [] };
    throw e;
  }
};
