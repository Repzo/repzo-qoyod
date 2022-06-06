import Repzo from "repzo";
import { _create } from "../util.js";
export const sync_invoice = async (commandEvent) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _j;
  try {
    console.log("sync_invoice");
    const nameSpace = commandEvent.nameSpace.join("_");
    const result = {
      created: 0,
      failed: 0,
    };
    const commandEvent_meta = JSON.parse(commandEvent.meta);
    const invoice_id = commandEvent_meta.invoice_id;
    if (!invoice_id)
      throw new Error("Invoice _id was not found on commandEvent.meta");
    const repzo = new Repzo(
      (_a = commandEvent.app.formData) === null || _a === void 0
        ? void 0
        : _a.repzoApiKey,
      {
        env: commandEvent.env,
      }
    );
    const repzo_invoice = await repzo.invoice.get(invoice_id, {
      populatedKeys: ["client"],
    });
    if (!repzo_invoice)
      throw new Error(`Invoice with _id: ${repzo_invoice} was not found`);
    // const qoyod_client = await repzo.client.get(repzo_invoice.client_id);
    // if (!qoyod_client.integration_meta?.qoyod_id)
    if (
      !((_b = repzo_invoice.client_id.integration_meta) === null ||
      _b === void 0
        ? void 0
        : _b.qoyod_id)
    )
      throw new Error(
        `Sync Invoice Failed >> invoice.client was missed the integration.qoyod_id`
      );
    const repzo_invoice_warehouse = await repzo.warehouse.get(
      repzo_invoice.origin_warehouse
    );
    if (
      !((_c = repzo_invoice_warehouse.integration_meta) === null ||
      _c === void 0
        ? void 0
        : _c.qoyod_id)
    )
      throw new Error(
        `Sync Invoice Failed >> invoice.origin_warehouse was missed the integration.qoyod_id`
      );
    const repzo_invoice_variant_ids = {};
    const repzo_invoice_measureunit_ids = {};
    repzo_invoice.items.forEach((item) => {
      repzo_invoice_variant_ids[item.variant.variant_id._id] = true;
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
        (variant) => variant._id == repzo_item.variant.variant_id._id
      );
      if (
        !((_d =
          repzo_variant === null || repzo_variant === void 0
            ? void 0
            : repzo_variant.integration_meta) === null || _d === void 0
          ? void 0
          : _d.qoyod_id)
      )
        throw new Error(
          `Sync Invoice Failed >> invoice.item.variant ${repzo_item.variant.variant_id._id} was missed the integration.qoyod_id`
        );
      const repzo_measureunit = repzo_measureunits.data.find(
        (unit) => unit._id == repzo_item.measureunit._id
      );
      if (
        !((_e =
          repzo_measureunit === null || repzo_measureunit === void 0
            ? void 0
            : repzo_measureunit.integration_meta) === null || _e === void 0
          ? void 0
          : _e.qoyod_id)
      )
        throw new Error(
          `Sync Invoice Failed >> invoice.item.measureunit ${repzo_item.measureunit._id} was missed the integration.qoyod_id`
        );
      qoyod_invoice_items.push({
        product_id:
          (_f =
            repzo_variant === null || repzo_variant === void 0
              ? void 0
              : repzo_variant.integration_meta) === null || _f === void 0
            ? void 0
            : _f.qoyod_id,
        description: "",
        quantity: repzo_item.qty,
        unit_price: repzo_item.discounted_price * 1000,
        unit_type:
          (_g =
            repzo_measureunit === null || repzo_measureunit === void 0
              ? void 0
              : repzo_measureunit.integration_meta) === null || _g === void 0
            ? void 0
            : _g.qoyod_id,
        discount: repzo_item.discount_value,
        discount_type: "amount",
        tax_percent: repzo_item.tax.rate,
        is_inclusive: repzo_item.tax.type == "inclusive",
      });
    }
    const qoyod_invoice_body = {
      invoice: {
        contact_id:
          (_h = repzo_invoice.client_id.integration_meta) === null ||
          _h === void 0
            ? void 0
            : _h.qoyod_id,
        reference: repzo_invoice.serial_number.formatted,
        description: repzo_invoice.comment,
        issue_date: repzo_invoice.issue_date,
        due_date: repzo_invoice.due_date,
        status: "Approved",
        inventory_id:
          (_j = repzo_invoice_warehouse.integration_meta) === null ||
          _j === void 0
            ? void 0
            : _j.qoyod_id,
        line_items: qoyod_invoice_items,
      },
    };
    // console.dir(qoyod_invoice_body, { depth: null });
    const qoyod_invoice = await _create(
      commandEvent.app.available_app.app_settings.serviceEndPoint,
      "/invoices",
      qoyod_invoice_body,
      { "API-KEY": commandEvent.app.formData.serviceApiKey }
    );
    // console.log(qoyod_invoice);
    // console.log(result);
    return result;
  } catch (e) {
    //@ts-ignore
    console.error(e);
    throw e === null || e === void 0 ? void 0 : e.response;
  }
};
