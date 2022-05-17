import Repzo from "repzo";
import { _fetch, _create } from "../util.js";
export const create_payment = async (event, options) => {
    var _a, _b, _c, _d;
    try {
        console.log("create_payment");
        let body = event.body;
        try {
            if (body)
                body = JSON.parse(body);
        }
        catch (e) { }
        const result = { created: 0, failed: 0 };
        const repzo = new Repzo((_a = options.data) === null || _a === void 0 ? void 0 : _a.repzoApiKey, { env: options.env });
        const repzo_payment = body;
        const qoyod_client = await repzo.client.get(repzo_payment.client_id);
        if (!((_b = qoyod_client.integration_meta) === null || _b === void 0 ? void 0 : _b.qoyod_id))
            throw new Error(`Create Payment Failed >> payment.client was missed the integration.qoyod_id`);
        const invoice_reference = (_d = (_c = repzo_payment.LinkedTxn) === null || _c === void 0 ? void 0 : _c.Txn_serial_number) === null || _d === void 0 ? void 0 : _d.formatted;
        if (!invoice_reference)
            throw new Error(`Create Payment Failed >> payment.reference: ${repzo_payment.serial_number.formatted} was not linked with specific invoice`);
        const qoyod_invoices = await get_qoyod_invoices(options.serviceEndPoint, options.data.serviceApiKey, `?q[reference_eq]=${invoice_reference}`);
        const qoyod_invoice = (qoyod_invoices === null || qoyod_invoices === void 0 ? void 0 : qoyod_invoices.invoices.length)
            ? qoyod_invoices === null || qoyod_invoices === void 0 ? void 0 : qoyod_invoices.invoices[0]
            : undefined;
        if (!qoyod_invoice)
            throw new Error(`Create Payment Failed >> invoice.reference: ${invoice_reference} was missed in Qoyod`);
        console.log(options.data.paymentAccountId);
        const qoyod_payment_body = {
            invoice_payment: {
                reference: repzo_payment.serial_number.formatted,
                invoice_id: qoyod_invoice.id.toString(),
                account_id: options.data.paymentAccountId,
                date: repzo_payment.paytime,
                amount: String(repzo_payment.amount / 1000),
            },
        };
        console.dir(qoyod_payment_body, { depth: null });
        const qoyod_payment = await _create(options.serviceEndPoint, "/invoice_payments", qoyod_payment_body, { "API-KEY": options.data.serviceApiKey });
        console.log(qoyod_payment);
        console.log(result);
        return result;
    }
    catch (e) {
        //@ts-ignore
        console.error(e);
        throw e === null || e === void 0 ? void 0 : e.response;
    }
};
const get_qoyod_invoices = async (serviceEndPoint, serviceApiKey, query) => {
    try {
        const qoyod_invoices = await _fetch(serviceEndPoint, `/invoices${query ? query : ""}`, { "API-KEY": serviceApiKey });
        return qoyod_invoices;
    }
    catch (e) {
        if (e.response.code == 404)
            return { invoices: [] };
        throw e;
    }
};
