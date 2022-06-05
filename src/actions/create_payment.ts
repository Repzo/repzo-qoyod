import Repzo from "repzo";
import { EVENT, Config } from "../types";
import { _fetch, _create, _update, _delete } from "../util.js";
import { Service } from "repzo/src/types";
import { v4 as uuid } from "uuid";

interface QoyodPayment {
  invoice_payment: {
    reference: string;
    invoice_id: string;
    account_id: string;
    date: string;
    amount: string;
  };
}

interface QoyodInvoiceItem {
  product_id: number;
  product_name: string;
  description: string;
  quantity: string;
  unit_price: string;
  unit_type: number;
  unit: string;
  discount_percent: string;
  discount_amount: string;
  tax_percent: string;
  line_total: string;
  inventory_id: number;
  is_inclusive: true;
  inclusive_unit_price: string;
  unrounded_vat_value: string;
}

interface QoyodInvoice {
  id: number;
  description?: string;
  issue_date: string;
  due_date: string;
  due_amount: string;
  paid_amount: string;
  total: string;
  contact_id: number;
  status: "Approved" | "Draft";
  reference: string;
  notes: string;
  terms_conditions: string;
  qrcode_string: string;
  created_at: Date;
  updated_at: Date;
  line_items: QoyodInvoiceItem[];
  payments: [];
}

interface QoyodInvoices {
  invoices: QoyodInvoice[];
}

export const create_payment = async (event: EVENT, options: Config) => {
  const repzo = new Repzo(options.data?.repzoApiKey, { env: options.env });
  const action_sync_id: string = event?.headers?.action_sync_id || uuid();
  const actionLog = new Repzo.ActionLogs(repzo, action_sync_id);
  try {
    console.log("create_payment");
    const result = { created: 0, failed: 0, failed_msg: [] };

    await actionLog.load(action_sync_id);
    await actionLog.addDetail(`Repzo Qoyod: Started Create Payment`).commit();

    let body: Service.Payment.PaymentSchema | any = event.body;
    try {
      if (body) body = JSON.parse(body);
    } catch (e) {}
    const repzo_payment = body;

    const qoyod_client = await repzo.client.get(repzo_payment.client_id);
    if (!qoyod_client.integration_meta?.qoyod_id)
      throw new Error(
        `Create Payment Failed >> payment.client was missed the integration.qoyod_id`
      );

    const invoice_reference =
      repzo_payment.LinkedTxn?.Txn_serial_number?.formatted;

    if (!invoice_reference)
      throw new Error(
        `Create Payment Failed >> payment.reference: ${repzo_payment.serial_number.formatted} was not linked with specific invoice`
      );

    const qoyod_invoices: QoyodInvoices = await get_qoyod_invoices(
      options.serviceEndPoint,
      options.data.serviceApiKey,
      `?q[reference_eq]=${invoice_reference}`
    );

    const qoyod_invoice = qoyod_invoices?.invoices.length
      ? qoyod_invoices?.invoices[0]
      : undefined;

    if (!qoyod_invoice)
      throw new Error(
        `Create Payment Failed >> invoice.reference: ${invoice_reference} was missed in Qoyod`
      );
    console.log(options.data.paymentAccountId);

    const qoyod_payment_body: QoyodPayment = {
      invoice_payment: {
        reference: repzo_payment.serial_number.formatted,
        invoice_id: qoyod_invoice.id.toString(),
        account_id: options.data.paymentAccountId,
        date: repzo_payment.paytime,
        amount: String(repzo_payment.amount / 1000),
      },
    };

    console.dir(qoyod_payment_body, { depth: null });

    const qoyod_payment = await _create(
      options.serviceEndPoint,
      "/invoice_payments",
      qoyod_payment_body,
      { "API-KEY": options.data.serviceApiKey }
    );

    console.log(qoyod_payment);

    console.log(result);
    await actionLog.setStatus("success").setBody(result).commit();
    return result;
  } catch (e: any) {
    //@ts-ignore
    console.error(e);
    await actionLog.setStatus("fail", e).commit();
    throw e?.response;
  }
};

const get_qoyod_invoices = async (
  serviceEndPoint: string,
  serviceApiKey: string,
  query?: string
): Promise<QoyodInvoices> => {
  try {
    const qoyod_invoices: QoyodInvoices = await _fetch(
      serviceEndPoint,
      `/invoices${query ? query : ""}`,
      { "API-KEY": serviceApiKey }
    );
    if (!qoyod_invoices.hasOwnProperty("invoices"))
      qoyod_invoices.invoices = [];
    return qoyod_invoices;
  } catch (e: any) {
    if (e.response.status == 404) return { invoices: [] };
    throw e;
  }
};
