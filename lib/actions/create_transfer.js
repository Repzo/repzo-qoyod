import Repzo from "repzo";
import { _create } from "../util.js";
import { v4 as uuid } from "uuid";
import moment from "moment-timezone";
export const create_transfer = async (event, options) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
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
    // console.log("create_transfer");
    await actionLog.load(action_sync_id);
    body = event.body;
    try {
      if (body) body = JSON.parse(body);
    } catch (e) {}
    await actionLog
      .addDetail(
        `Repzo Qoyod: Started Create Transfer - ${
          (_c =
            body === null || body === void 0 ? void 0 : body.serial_number) ===
            null || _c === void 0
            ? void 0
            : _c.formatted
        }`
      )
      .commit();
    const repzo_transfer = body;
    if (typeof repzo_transfer.from == "string") {
      const repzo_transfer_FROM_warehouse = await repzo.warehouse.get(
        repzo_transfer.from
      );
      if (
        !((_d =
          repzo_transfer_FROM_warehouse === null ||
          repzo_transfer_FROM_warehouse === void 0
            ? void 0
            : repzo_transfer_FROM_warehouse.integration_meta) === null ||
        _d === void 0
          ? void 0
          : _d.qoyod_id)
      )
        throw new Error(
          `Sync Transfer Failed >> transfer.from: ${repzo_transfer.from} - ${
            repzo_transfer_FROM_warehouse === null ||
            repzo_transfer_FROM_warehouse === void 0
              ? void 0
              : repzo_transfer_FROM_warehouse.name
          } was missed the integration.qoyod_id`
        );
      repzo_transfer.from = repzo_transfer_FROM_warehouse;
    }
    if (typeof repzo_transfer.to == "string") {
      const repzo_transfer_TO_warehouse = await repzo.warehouse.get(
        repzo_transfer.to
      );
      if (
        !((_e =
          repzo_transfer_TO_warehouse === null ||
          repzo_transfer_TO_warehouse === void 0
            ? void 0
            : repzo_transfer_TO_warehouse.integration_meta) === null ||
        _e === void 0
          ? void 0
          : _e.qoyod_id)
      )
        throw new Error(
          `Sync Transfer Failed >> transfer.to: ${repzo_transfer.to} - ${
            repzo_transfer_TO_warehouse === null ||
            repzo_transfer_TO_warehouse === void 0
              ? void 0
              : repzo_transfer_TO_warehouse.name
          } was missed the integration.qoyod_id`
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
        !((_f =
          repzo_variant === null || repzo_variant === void 0
            ? void 0
            : repzo_variant.integration_meta) === null || _f === void 0
          ? void 0
          : _f.qoyod_id)
      )
        throw new Error(
          `Sync Transfer Failed >> transfer.variant_id ${repzo_item.variant_id} was missed the integration.qoyod_id`
        );
      qoyod_transfer_items.push({
        product_id:
          (_g =
            repzo_variant === null || repzo_variant === void 0
              ? void 0
              : repzo_variant.integration_meta) === null || _g === void 0
            ? void 0
            : _g.qoyod_id,
        quantity: "" + repzo_item.qty,
      });
    }
    const qoyod_transfer_body = {
      inventory_transfer: {
        reference:
          (_h =
            repzo_transfer === null || repzo_transfer === void 0
              ? void 0
              : repzo_transfer.serial_number) === null || _h === void 0
            ? void 0
            : _h.formatted,
        from_location:
          (_j = repzo_transfer.from.integration_meta) === null || _j === void 0
            ? void 0
            : _j.qoyod_id,
        to_location:
          (_k = repzo_transfer.to.integration_meta) === null || _k === void 0
            ? void 0
            : _k.qoyod_id,
        date: moment(repzo_transfer.time, "x").format("YYYY-MM-DD"),
        description: repzo_transfer.serial_number.formatted,
        line_items: qoyod_transfer_items,
      },
    };
    // actionLog.setMeta(qoyod_transfer_body);
    // console.dir(qoyod_transfer_body, { depth: null });
    await actionLog
      .addDetail(
        `Repzo Qoyod: Transfer - ${
          (_l =
            qoyod_transfer_body === null || qoyod_transfer_body === void 0
              ? void 0
              : qoyod_transfer_body.inventory_transfer) === null ||
          _l === void 0
            ? void 0
            : _l.reference
        }`,
        qoyod_transfer_body
      )
      .commit();
    const result = await _create(
      options.serviceEndPoint,
      "/inventory_transfers",
      qoyod_transfer_body,
      { "API-KEY": options.data.serviceApiKey }
    );
    // console.log(result);
    await actionLog
      .addDetail(`Qoyod Responded with `, result)
      .setStatus(result)
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
