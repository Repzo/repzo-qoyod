import Repzo from "repzo";
import { _create } from "../util.js";
import { v4 as uuid } from "uuid";
export const create_refund = async (event, options) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
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
    await actionLog.load(action_sync_id);
    body = event.body;
    try {
      if (body) body = JSON.parse(body);
    } catch (e) {}
    await actionLog
      .addDetail(
        `Repzo Qoyod: Started Create Refund - ${
          (_c =
            body === null || body === void 0 ? void 0 : body.serial_number) ===
            null || _c === void 0
            ? void 0
            : _c.formatted
        }`
      )
      .commit();
    const repzo_refund = body;
    const rep_id =
      ((_d = repzo_refund.creator) === null || _d === void 0
        ? void 0
        : _d.type) === "rep"
        ? (_e = repzo_refund.creator) === null || _e === void 0
          ? void 0
          : _e._id
        : null;
    let rep, qoyod_refund_account_id;
    if (
      ((_f = repzo_refund.creator) === null || _f === void 0
        ? void 0
        : _f.type) === "rep" &&
      rep_id
    ) {
      rep = await repzo.rep.get(rep_id);
      qoyod_refund_account_id =
        (_g = rep.integration_meta) === null || _g === void 0
          ? void 0
          : _g.qoyod_refund_account_id;
    }
    const qoyod_client = await repzo.client.get(repzo_refund.client_id);
    if (
      !((_h = qoyod_client.integration_meta) === null || _h === void 0
        ? void 0
        : _h.qoyod_id)
    )
      throw new Error(
        `Create Refund Failed >> refund.client: ${repzo_refund.client_id} - ${repzo_refund.client_name} was missed the integration.qoyod_id`
      );
    const qoyod_refund_body = {
      receipt: {
        contact_id:
          (_j = qoyod_client.integration_meta) === null || _j === void 0
            ? void 0
            : _j.qoyod_id,
        reference: repzo_refund.serial_number.formatted,
        kind: "paid",
        account_id: qoyod_refund_account_id
          ? qoyod_refund_account_id
          : options.data.paymentAccountId,
        amount: repzo_refund.amount / 1000,
        // description: "Testing api",
        date: repzo_refund.paytime,
      },
    };
    await actionLog
      .addDetail(
        `Repzo Qoyod: Trying to post refund to qoyod`,
        qoyod_refund_body
      )
      .commit();
    // console.dir(qoyod_refund_body, { depth: null });
    // actionLog.setMeta(qoyod_refund_body);
    await actionLog
      .addDetail(
        `Repzo Qoyod: Refund - ${
          (_k =
            qoyod_refund_body === null || qoyod_refund_body === void 0
              ? void 0
              : qoyod_refund_body.receipt) === null || _k === void 0
            ? void 0
            : _k.reference
        }`,
        qoyod_refund_body
      )
      .commit();
    const result = await _create(
      options.serviceEndPoint,
      "/receipts",
      qoyod_refund_body,
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
