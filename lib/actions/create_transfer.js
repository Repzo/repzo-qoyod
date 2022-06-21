import Repzo from "repzo";
import { _create } from "../util.js";
import { v4 as uuid } from "uuid";
import moment from "moment-timezone";
export const create_transfer = async (event, options) => {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  console.log("*".repeat(20));
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
    console.log("create_transfer");
    await actionLog.load(action_sync_id);
    await actionLog.addDetail(`Repzo Qoyod: Started Create Transfer`).commit();
    body = event.body;
    try {
      if (body) body = JSON.parse(body);
    } catch (e) {}
    const result = { created: 0, failed: 0, failed_msg: [] };
    const repzo_transfer = body;
    if (typeof repzo_transfer.from == "string") {
      const repzo_transfer_FROM_warehouse = await repzo.warehouse.get(
        repzo_transfer.from
      );
      if (
        !((_c =
          repzo_transfer_FROM_warehouse === null ||
          repzo_transfer_FROM_warehouse === void 0
            ? void 0
            : repzo_transfer_FROM_warehouse.integration_meta) === null ||
        _c === void 0
          ? void 0
          : _c.qoyod_id)
      )
        throw new Error(
          `Sync Transfer Failed >> transfer.from was missed the integration.qoyod_id`
        );
      repzo_transfer.from = repzo_transfer_FROM_warehouse;
    }
    if (typeof repzo_transfer.to == "string") {
      const repzo_transfer_TO_warehouse = await repzo.warehouse.get(
        repzo_transfer.to
      );
      if (
        !((_d =
          repzo_transfer_TO_warehouse === null ||
          repzo_transfer_TO_warehouse === void 0
            ? void 0
            : repzo_transfer_TO_warehouse.integration_meta) === null ||
        _d === void 0
          ? void 0
          : _d.qoyod_id)
      )
        throw new Error(
          `Sync Transfer Failed >> transfer.to was missed the integration.qoyod_id`
        );
      repzo_transfer.to = repzo_transfer_TO_warehouse;
    }
    const repzo_transfer_variant_ids = {};
    repzo_transfer.variants.forEach((variant) => {
      repzo_transfer_variant_ids[variant.variant_id] = true;
    });
    const repzo_variants = await repzo.variant.find({
      _id: Object.keys(repzo_transfer_variant_ids),
    });
    const qoyod_transfer_items = [];
    for (let i = 0; i < repzo_transfer.variants.length; i++) {
      const repzo_item = repzo_transfer.variants[i];
      const repzo_variant = repzo_variants.data.find(
        (variant) => variant._id == repzo_item.variant_id
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
          `Sync Transfer Failed >> transfer.variant_id ${repzo_item.variant_id} was missed the integration.qoyod_id`
        );
      qoyod_transfer_items.push({
        product_id:
          (_f =
            repzo_variant === null || repzo_variant === void 0
              ? void 0
              : repzo_variant.integration_meta) === null || _f === void 0
            ? void 0
            : _f.qoyod_id,
        quantity: "" + repzo_item.qty,
      });
    }
    const qoyod_transfer_body = {
      inventory_transfer: {
        from_location:
          (_g = repzo_transfer.from.integration_meta) === null || _g === void 0
            ? void 0
            : _g.qoyod_id,
        to_location:
          (_h = repzo_transfer.to.integration_meta) === null || _h === void 0
            ? void 0
            : _h.qoyod_id,
        date: moment(repzo_transfer.time, "x").format("YYYY-MM-DD"),
        description: repzo_transfer.serial_number.formatted,
        line_items: qoyod_transfer_items,
      },
    };
    console.dir(qoyod_transfer_body, { depth: null });
    const qoyod_transfer = await _create(
      options.serviceEndPoint,
      "/inventory_transfers",
      qoyod_transfer_body,
      { "API-KEY": options.data.serviceApiKey }
    );
    console.log(qoyod_transfer);
    console.log(result);
    await actionLog.setStatus("success", result).setBody(body).commit();
    return result;
  } catch (e) {
    //@ts-ignore
    console.error(e);
    await actionLog.setStatus("fail", e).setBody(body).commit();
    throw e === null || e === void 0 ? void 0 : e.response;
  }
};
