import Repzo from "repzo";
import { _create } from "../util.js";
import { v4 as uuid } from "uuid";
export const create_invoice = async (event, options) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
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
  let body;
  try {
    // console.log("create_invoice");
    await actionLog.load(action_sync_id);
    body = event.body;
    try {
      if (body) body = JSON.parse(body);
    } catch (e) {}
    await actionLog
      .addDetail(
        `Repzo Qoyod: Started Create Invoice - ${
          (_c =
            body === null || body === void 0 ? void 0 : body.serial_number) ===
            null || _c === void 0
            ? void 0
            : _c.formatted
        }`
      )
      .commit();
    const repzo_invoice = body;
    const qoyod_client = await repzo.client.get(repzo_invoice.client_id);
    if (
      !((_d = qoyod_client.integration_meta) === null || _d === void 0
        ? void 0
        : _d.qoyod_id)
    )
      throw new Error(
        `Sync Invoice Failed >> invoice.client: ${repzo_invoice.client_id} - ${repzo_invoice.client_name} was missed the integration.qoyod_id`
      );
    const repzo_invoice_warehouse = await repzo.warehouse.get(
      repzo_invoice.origin_warehouse
    );
    if (
      !((_e = repzo_invoice_warehouse.integration_meta) === null ||
      _e === void 0
        ? void 0
        : _e.qoyod_id)
    )
      throw new Error(
        `Sync Invoice Failed >> invoice.origin_warehouse: ${
          repzo_invoice.origin_warehouse
        } - ${
          repzo_invoice_warehouse === null || repzo_invoice_warehouse === void 0
            ? void 0
            : repzo_invoice_warehouse.name
        } was missed the integration.qoyod_id`
      );
    const repzo_invoice_variant_ids = {};
    const repzo_invoice_measureunit_ids = {};
    repzo_invoice.items.forEach((item) => {
      repzo_invoice_variant_ids[item.variant.variant_id] = true;
      repzo_invoice_measureunit_ids[item.measureunit._id] = true;
    });
    const repzo_variants = await repzo.variant.find({
      _id: Object.keys(repzo_invoice_variant_ids),
      per_page: 50000,
    });
    const repzo_measureunits = await repzo.measureunit.find({
      _id: Object.keys(repzo_invoice_measureunit_ids),
      per_page: 50000,
    });
    const qoyod_invoice_items = [];
    for (let i = 0; i < repzo_invoice.items.length; i++) {
      const repzo_item = repzo_invoice.items[i];
      const repzo_variant = repzo_variants.data.find(
        (variant) => variant._id == repzo_item.variant.variant_id
      );
      if (
        !((_f =
          repzo_variant === null || repzo_variant === void 0
            ? void 0
            : repzo_variant.integration_meta) === null || _f === void 0
          ? void 0
          : _f.qoyod_id)
      )
        throw new Error(
          `Sync Invoice Failed >> invoice.item.variant ${repzo_item.variant.variant_id} was missed the integration.qoyod_id`
        );
      const repzo_measureunit = repzo_measureunits.data.find(
        (unit) => unit._id == repzo_item.measureunit._id
      );
      if (
        !((_g =
          repzo_measureunit === null || repzo_measureunit === void 0
            ? void 0
            : repzo_measureunit.integration_meta) === null || _g === void 0
          ? void 0
          : _g.qoyod_id)
      )
        throw new Error(
          `Sync Invoice Failed >> invoice.item.measureunit ${repzo_item.measureunit._id} was missed the integration.qoyod_id`
        );
      qoyod_invoice_items.push({
        product_id:
          (_h =
            repzo_variant === null || repzo_variant === void 0
              ? void 0
              : repzo_variant.integration_meta) === null || _h === void 0
            ? void 0
            : _h.qoyod_id,
        description: "",
        quantity: repzo_item.qty,
        unit_price:
          ((((_j =
            repzo_item === null || repzo_item === void 0
              ? void 0
              : repzo_item.measureunit) === null || _j === void 0
            ? void 0
            : _j.factor) || 1) *
            repzo_item.discounted_price) /
          1000,
        unit_type:
          (_k =
            repzo_measureunit === null || repzo_measureunit === void 0
              ? void 0
              : repzo_measureunit.integration_meta) === null || _k === void 0
            ? void 0
            : _k.qoyod_id,
        // discount: repzo_item.discount_value,
        // discount_type: "amount", // "percentage" | "amount"; // default percentage
        tax_percent: repzo_item.tax.rate * 100,
        is_inclusive: repzo_item.tax.type == "inclusive",
      });
    }
    const qoyod_invoice_body = {
      invoice: {
        contact_id:
          (_l = qoyod_client.integration_meta) === null || _l === void 0
            ? void 0
            : _l.qoyod_id,
        reference: repzo_invoice.serial_number.formatted,
        description: repzo_invoice.comment,
        issue_date: repzo_invoice.issue_date,
        due_date: repzo_invoice.due_date,
        status:
          (_o =
            (_m =
              options === null || options === void 0
                ? void 0
                : options.data) === null || _m === void 0
              ? void 0
              : _m.invoices) === null || _o === void 0
            ? void 0
            : _o.invoiceInitialStatus,
        inventory_id:
          (_p = repzo_invoice_warehouse.integration_meta) === null ||
          _p === void 0
            ? void 0
            : _p.qoyod_id,
        line_items: qoyod_invoice_items,
        draft_if_out_of_stock: true,
      },
    };
    // console.dir(qoyod_invoice_body, { depth: null });
    // actionLog.setMeta(qoyod_invoice_body);
    await actionLog
      .addDetail(
        `Repzo Qoyod: Invoice - ${
          (_q =
            qoyod_invoice_body === null || qoyod_invoice_body === void 0
              ? void 0
              : qoyod_invoice_body.invoice) === null || _q === void 0
            ? void 0
            : _q.reference
        }`,
        qoyod_invoice_body
      )
      .commit();
    const result = await _create(
      options.serviceEndPoint,
      "/invoices",
      qoyod_invoice_body,
      { "API-KEY": options.data.serviceApiKey }
    );
    // console.log(result);
    await actionLog
      .addDetail(`Qoyod Responded with `, result)
      .setStatus("success")
      .setBody(body)
      .commit();
    return result;
  } catch (e) {
    //@ts-ignore
    console.error((e === null || e === void 0 ? void 0 : e.response) || e);
    await actionLog.setStatus("fail", e).setBody(body).commit();
    throw e;
  }
};
