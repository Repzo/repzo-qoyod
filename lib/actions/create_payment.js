import Repzo from "repzo";
import { _fetch, _create } from "../util.js";
import { v4 as uuid } from "uuid";
export const create_payment = async (event, options) => {
  var _a, _b, _c, _d, _e, _f, _g;
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
    const result = { created: 0, failed: 0, failed_msg: [] };
    await actionLog.load(action_sync_id);
    await actionLog.addDetail(`Repzo Qoyod: Started Create Payment`).commit();
    let body = event.body;
    try {
      if (body) body = JSON.parse(body);
    } catch (e) {}
    const repzo_payment = body;
    const rep_id =
      (_c = repzo_payment.creator) === null || _c === void 0 ? void 0 : _c.rep;
    let rep, qoyod_payment_account_id;
    if (rep_id) {
      rep = await repzo.rep.get(rep_id);
      qoyod_payment_account_id =
        (_d = rep.integration_meta) === null || _d === void 0
          ? void 0
          : _d.qoyod_payment_account_id;
    }
    const qoyod_client = await repzo.client.get(repzo_payment.client_id);
    if (
      !((_e = qoyod_client.integration_meta) === null || _e === void 0
        ? void 0
        : _e.qoyod_id)
    )
      throw new Error(
        `Create Payment Failed >> payment.client was missed the integration.qoyod_id`
      );
    const invoice_reference =
      (_g =
        (_f = repzo_payment.LinkedTxn) === null || _f === void 0
          ? void 0
          : _f.Txn_serial_number) === null || _g === void 0
        ? void 0
        : _g.formatted;
    if (!invoice_reference)
      throw new Error(
        `Create Payment Failed >> payment.reference: ${repzo_payment.serial_number.formatted} was not linked with specific invoice`
      );
    const qoyod_invoices = await get_qoyod_invoices(
      options.serviceEndPoint,
      options.data.serviceApiKey,
      `?q[reference_eq]=${invoice_reference}`
    );
    const qoyod_invoice = (
      qoyod_invoices === null || qoyod_invoices === void 0
        ? void 0
        : qoyod_invoices.invoices.length
    )
      ? qoyod_invoices === null || qoyod_invoices === void 0
        ? void 0
        : qoyod_invoices.invoices[0]
      : undefined;
    if (!qoyod_invoice)
      throw new Error(
        `Create Payment Failed >> invoice.reference: ${invoice_reference} was missed in Qoyod`
      );
    // console.log(options.data.paymentAccountId);
    const qoyod_payment_body = {
      invoice_payment: {
        reference: repzo_payment.serial_number.formatted,
        invoice_id: qoyod_invoice.id.toString(),
        account_id: qoyod_payment_account_id
          ? qoyod_payment_account_id
          : options.data.paymentAccountId,
        date: repzo_payment.paytime,
        amount: String(repzo_payment.amount / 1000),
      },
    };
    // console.dir(qoyod_payment_body, { depth: null });
    const qoyod_payment = await _create(
      options.serviceEndPoint,
      "/invoice_payments",
      qoyod_payment_body,
      { "API-KEY": options.data.serviceApiKey }
    );
    // console.log(qoyod_payment);
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
const get_qoyod_invoices = async (serviceEndPoint, serviceApiKey, query) => {
  try {
    const qoyod_invoices = await _fetch(
      serviceEndPoint,
      `/invoices${query ? query : ""}`,
      { "API-KEY": serviceApiKey }
    );
    if (!qoyod_invoices.hasOwnProperty("invoices"))
      qoyod_invoices.invoices = [];
    return qoyod_invoices;
  } catch (e) {
    if (e.response.status == 404) return { invoices: [] };
    throw e;
  }
};
