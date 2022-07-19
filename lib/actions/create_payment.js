import Repzo from "repzo";
import { _fetch, _create } from "../util.js";
import { v4 as uuid } from "uuid";
export const create_payment = async (event, options) => {
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
        `Repzo Qoyod: Started Create Payment - ${
          (_c =
            body === null || body === void 0 ? void 0 : body.serial_number) ===
            null || _c === void 0
            ? void 0
            : _c.formatted
        }`
      )
      .commit();
    const repzo_payment = body;
    const rep_id =
      ((_d = repzo_payment.creator) === null || _d === void 0
        ? void 0
        : _d.type) === "rep"
        ? (_e = repzo_payment.creator) === null || _e === void 0
          ? void 0
          : _e._id
        : null;
    let rep, qoyod_payment_account_id;
    if (
      ((_f = repzo_payment.creator) === null || _f === void 0
        ? void 0
        : _f.type) === "rep" &&
      rep_id
    ) {
      rep = await repzo.rep.get(rep_id);
      qoyod_payment_account_id =
        (_g = rep.integration_meta) === null || _g === void 0
          ? void 0
          : _g.qoyod_payment_account_id;
    }
    const qoyod_client = await repzo.client.get(repzo_payment.client_id);
    if (
      !((_h = qoyod_client.integration_meta) === null || _h === void 0
        ? void 0
        : _h.qoyod_id)
    )
      throw new Error(
        `Create Payment Failed >> payment.client: ${repzo_payment.client_id} - ${repzo_payment.client_name} was missed the integration.qoyod_id`
      );
    let result;
    if (
      (_k =
        (_j = repzo_payment.LinkedTxn) === null || _j === void 0
          ? void 0
          : _j.Txn_serial_number) === null || _k === void 0
        ? void 0
        : _k.formatted
    )
      result = await create_invoice_payment({
        repzo_payment,
        options,
        qoyod_payment_account_id,
        actionLog,
      });
    else
      result = await create_receipt({
        repzo_payment,
        options,
        qoyod_payment_account_id,
        actionLog,
        qoyod_client,
      });
    await actionLog
      .addDetail(`Qoyod Responded with `, result)
      .setStatus("success")
      .setBody(body)
      .setMeta(qoyod_payment_account_id)
      .commit();
    return result;
  } catch (e) {
    //@ts-ignore
    console.error((e === null || e === void 0 ? void 0 : e.response) || e);
    await actionLog.setStatus("fail", e).setBody(body).commit();
    throw e;
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
const create_invoice_payment = async ({
  repzo_payment,
  options,
  qoyod_payment_account_id,
  actionLog,
}) => {
  var _a, _b, _c;
  try {
    const invoice_reference =
      (_b =
        (_a = repzo_payment.LinkedTxn) === null || _a === void 0
          ? void 0
          : _a.Txn_serial_number) === null || _b === void 0
        ? void 0
        : _b.formatted;
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
    await actionLog
      .addDetail(
        `Repzo Qoyod: Payment - ${
          (_c =
            qoyod_payment_body === null || qoyod_payment_body === void 0
              ? void 0
              : qoyod_payment_body.invoice_payment) === null || _c === void 0
            ? void 0
            : _c.reference
        }`,
        qoyod_payment_body
      )
      .commit();
    // console.dir(qoyod_payment_body, { depth: null });
    const qoyod_payment = await _create(
      options.serviceEndPoint,
      "/invoice_payments",
      qoyod_payment_body,
      { "API-KEY": options.data.serviceApiKey }
    );
    // console.log(qoyod_payment);
    return qoyod_payment;
  } catch (e) {
    throw e;
  }
};
const create_receipt = async ({
  repzo_payment,
  options,
  qoyod_payment_account_id,
  actionLog,
  qoyod_client,
}) => {
  var _a, _b;
  try {
    const qoyod_payment_body = {
      receipt: {
        contact_id:
          (_a = qoyod_client.integration_meta) === null || _a === void 0
            ? void 0
            : _a.qoyod_id,
        reference: repzo_payment.serial_number.formatted,
        kind: "received",
        account_id: qoyod_payment_account_id
          ? qoyod_payment_account_id
          : options.data.paymentAccountId,
        amount: repzo_payment.amount / 1000,
        // description: "Testing api",
        date: repzo_payment.paytime,
      },
    };
    await actionLog
      .addDetail(
        `Repzo Qoyod: Receipt - ${
          (_b =
            qoyod_payment_body === null || qoyod_payment_body === void 0
              ? void 0
              : qoyod_payment_body.receipt) === null || _b === void 0
            ? void 0
            : _b.reference
        }`,
        qoyod_payment_body
      )
      .commit();
    // console.dir(qoyod_payment_body, { depth: null });
    const qoyod_payment = await _create(
      options.serviceEndPoint,
      "/receipts",
      qoyod_payment_body,
      { "API-KEY": options.data.serviceApiKey }
    );
    // console.log(qoyod_payment);
    return qoyod_payment;
  } catch (e) {
    throw e;
  }
};
