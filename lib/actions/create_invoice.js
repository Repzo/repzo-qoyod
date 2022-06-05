import Repzo from "repzo";
import { _create } from "../util.js";
import { v4 as uuid } from "uuid";
export const create_invoice = async (event, options) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
  const repzo = new Repzo(
    (_a = options.data) === null || _a === void 0 ? void 0 : _a.repzoApiKey,
    { env: options.env }
  );
  const action_sync_id =
    ((_b = event === null || event === void 0 ? void 0 : event.headers) ===
      null || _b === void 0
      ? void 0
      : _b.action_sync_id) || uuid();
  const actionLog = new Repzo.ActionLogs(repzo, action_sync_id);
  try {
    // console.log("create_invoice");
    await actionLog.load(action_sync_id);
    await actionLog.addDetail(`Repzo Qoyod: Started Create Invoice`).commit();
    let body = event.body;
    try {
      if (body) body = JSON.parse(body);
    } catch (e) {}
    const result = { created: 0, failed: 0, failed_msg: [] };
    const repzo_invoice = body;
    const qoyod_client = await repzo.client.get(repzo_invoice.client_id);
    if (
      !((_c = qoyod_client.integration_meta) === null || _c === void 0
        ? void 0
        : _c.qoyod_id)
    )
      throw new Error(
        `Sync Invoice Failed >> invoice.client was missed the integration.qoyod_id`
      );
    const repzo_invoice_warehouse = await repzo.warehouse.get(
      repzo_invoice.origin_warehouse
    );
    if (
      !((_d = repzo_invoice_warehouse.integration_meta) === null ||
      _d === void 0
        ? void 0
        : _d.qoyod_id)
    )
      throw new Error(
        `Sync Invoice Failed >> invoice.origin_warehouse was missed the integration.qoyod_id`
      );
    const repzo_invoice_variant_ids = {};
    const repzo_invoice_measureunit_ids = {};
    repzo_invoice.items.forEach((item) => {
      repzo_invoice_variant_ids[item.variant.variant_id] = true;
      repzo_invoice_measureunit_ids[item.measureunit._id] = true;
    });
    const repzo_variants = await repzo.variant.find({
      _id: Object.keys(repzo_invoice_variant_ids),
    });
    const repzo_measureunits = await repzo.measureunit.find({
      _id: Object.keys(repzo_invoice_measureunit_ids),
    });
    const qoyod_invoice_items = [];
    for (let i = 0; i < repzo_invoice.items.length; i++) {
      const repzo_item = repzo_invoice.items[i];
      const repzo_variant = repzo_variants.data.find(
        (variant) => variant._id == repzo_item.variant.variant_id
      );
      if (
        !((_e =
          repzo_variant === null || repzo_variant === void 0
            ? void 0
            : repzo_variant.integration_meta) === null || _e === void 0
          ? void 0
          : _e.qoyod_id)
      )
        throw new Error(
          `Sync Invoice Failed >> invoice.item.variant ${repzo_item.variant.variant_id} was missed the integration.qoyod_id`
        );
      const repzo_measureunit = repzo_measureunits.data.find(
        (unit) => unit._id == repzo_item.measureunit._id
      );
      if (
        !((_f =
          repzo_measureunit === null || repzo_measureunit === void 0
            ? void 0
            : repzo_measureunit.integration_meta) === null || _f === void 0
          ? void 0
          : _f.qoyod_id)
      )
        throw new Error(
          `Sync Invoice Failed >> invoice.item.measureunit ${repzo_item.measureunit._id} was missed the integration.qoyod_id`
        );
      qoyod_invoice_items.push({
        product_id:
          (_g =
            repzo_variant === null || repzo_variant === void 0
              ? void 0
              : repzo_variant.integration_meta) === null || _g === void 0
            ? void 0
            : _g.qoyod_id,
        description: "",
        quantity: repzo_item.qty,
        unit_price: repzo_item.discounted_price / 1000,
        unit_type:
          (_h =
            repzo_measureunit === null || repzo_measureunit === void 0
              ? void 0
              : repzo_measureunit.integration_meta) === null || _h === void 0
            ? void 0
            : _h.qoyod_id,
        // discount: repzo_item.discount_value,
        // discount_type: "amount", // "percentage" | "amount"; // default percentage
        tax_percent: repzo_item.tax.rate * 100,
        is_inclusive: repzo_item.tax.type == "inclusive",
      });
    }
    const qoyod_invoice_body = {
      invoice: {
        contact_id:
          (_j = qoyod_client.integration_meta) === null || _j === void 0
            ? void 0
            : _j.qoyod_id,
        reference: repzo_invoice.serial_number.formatted,
        description: repzo_invoice.comment,
        issue_date: repzo_invoice.issue_date,
        due_date: repzo_invoice.due_date,
        status:
          (_l =
            (_k =
              options === null || options === void 0
                ? void 0
                : options.data) === null || _k === void 0
              ? void 0
              : _k.invoices) === null || _l === void 0
            ? void 0
            : _l.invoiceInitialStatus,
        inventory_id:
          (_m = repzo_invoice_warehouse.integration_meta) === null ||
          _m === void 0
            ? void 0
            : _m.qoyod_id,
        line_items: qoyod_invoice_items,
        draft_if_out_of_stock: true,
      },
    };
    // console.dir(qoyod_invoice_body, { depth: null });
    const qoyod_invoice = await _create(
      options.serviceEndPoint,
      "/invoices",
      qoyod_invoice_body,
      { "API-KEY": options.data.serviceApiKey }
    );
    // console.log(qoyod_invoice);
    // console.log(result);
    await actionLog.setStatus("success").setBody(result).commit();
    return result;
  } catch (e) {
    //@ts-ignore
    console.error(e);
    await actionLog.setStatus("fail", e).commit();
    throw e === null || e === void 0 ? void 0 : e.response;
  }
};
