import Repzo from "repzo";
import { EVENT, Config } from "../types";
import { _fetch, _create, _update, _delete } from "../util.js";
import { Service } from "repzo/src/types";
import { v4 as uuid } from "uuid";

interface QoyodCreditNoteItem {
  product_id: number; // product_id
  description?: string;
  quantity: number;
  unit_price: number; // not fils
  unit_type?: number; // measureunit_id
  discount?: number;
  discount_type?: "percentage" | "amount"; // default percentage
  tax_percent?: number;
  is_inclusive?: boolean; // Not found in Qoyod documentation
}

interface QoyodCreditNote {
  credit_note: {
    contact_id: number; // client_id
    reference: string; // serial_number
    issue_date: string;
    status: "Draft" | "Approved";
    inventory_id: number; // warehouse_id
    term_conditions?: string;
    notes?: string;
    line_items: QoyodCreditNoteItem[];
    custom_fields?: {
      [key: string]: string;
    };
  };
}

export const create_creditNote = async (event: EVENT, options: Config) => {
  const repzo = new Repzo(options.data?.repzoApiKey, { env: options.env });
  const action_sync_id: string = event?.headers?.action_sync_id || uuid();
  const actionLog = new Repzo.ActionLogs(repzo, action_sync_id);
  let body: Service.FullInvoice.InvoiceSchema | any;
  try {
    // console.log("create_creditNote");
    await actionLog.load(action_sync_id);

    body = event.body;
    try {
      if (body) body = JSON.parse(body);
    } catch (e) {}

    await actionLog
      .addDetail(
        `Repzo Qoyod: Started Create Credit Note - ${body?.serial_number?.formatted}`
      )
      .commit();

    const repzo_invoice = body;

    const qoyod_client = await repzo.client.get(repzo_invoice.client_id);
    if (!qoyod_client.integration_meta?.qoyod_id)
      throw new Error(
        `Sync Invoice Failed >> invoice.client: ${repzo_invoice.client_id} - ${repzo_invoice.client_name} was missed the integration.qoyod_id`
      );

    const repzo_invoice_warehouse = await repzo.warehouse.get(
      repzo_invoice.origin_warehouse
    );
    if (!repzo_invoice_warehouse.integration_meta?.qoyod_id)
      throw new Error(
        `Sync Invoice Failed >> invoice.origin_warehouse: ${repzo_invoice.origin_warehouse} was missed the integration.qoyod_id`
      );

    const repzo_invoice_variant_ids: any = {};
    const repzo_invoice_measureunit_ids: any = {};

    repzo_invoice.return_items.forEach((item: Service.Item.Schema) => {
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

    const qoyod_invoice_return_items: QoyodCreditNoteItem[] = [];
    for (let i = 0; i < repzo_invoice.return_items.length; i++) {
      const repzo_item = repzo_invoice.return_items[i];
      const repzo_variant = repzo_variants.data.find(
        (variant) => variant._id == repzo_item.variant.variant_id
      );
      if (!repzo_variant?.integration_meta?.qoyod_id)
        throw new Error(
          `Sync Invoice Failed >> invoice.return_item.variant ${repzo_item.variant.variant_id} was missed the integration.qoyod_id`
        );

      const repzo_measureunit = repzo_measureunits.data.find(
        (unit) => unit._id == repzo_item.measureunit._id
      );
      if (!repzo_measureunit?.integration_meta?.qoyod_id)
        throw new Error(
          `Sync Invoice Failed >> invoice.return_item.measureunit ${repzo_item.measureunit._id} was missed the integration.qoyod_id`
        );

      qoyod_invoice_return_items.push({
        product_id: repzo_variant?.integration_meta?.qoyod_id,
        description: "",
        quantity: Math.abs(repzo_item.qty),
        unit_price:
          ((repzo_item?.measureunit?.factor || 1) *
            repzo_item.discounted_price) /
          1000,
        unit_type: repzo_measureunit?.integration_meta?.qoyod_id,
        // discount: repzo_item.discount_value,
        // discount_type: "amount", // "percentage" | "amount"; // default percentage
        tax_percent: repzo_item.tax.rate * 100,
        is_inclusive: repzo_item.tax.type == "inclusive",
      });
    }

    const qoyod_creditNote_body: QoyodCreditNote = {
      credit_note: {
        contact_id: qoyod_client.integration_meta?.qoyod_id, // (repzo_invoice.client_id as any).integration_meta?.qoyod_id,
        reference: repzo_invoice.serial_number.formatted,
        notes: repzo_invoice.comment,
        issue_date: repzo_invoice.issue_date,
        // due_date: repzo_invoice.due_date,
        status: options?.data?.invoices?.invoiceInitialStatus,
        inventory_id: repzo_invoice_warehouse.integration_meta?.qoyod_id,
        line_items: qoyod_invoice_return_items,
      },
    };

    // console.dir(qoyod_creditNote_body, { depth: null });
    // actionLog.setMeta(qoyod_creditNote_body);
    await actionLog
      .addDetail(
        `Repzo Qoyod: Credit Note - ${qoyod_creditNote_body?.credit_note?.reference}`,
        qoyod_creditNote_body
      )
      .commit();

    const result = await _create(
      options.serviceEndPoint,
      "/credit_notes",
      qoyod_creditNote_body,
      { "API-KEY": options.data.serviceApiKey }
    );

    // console.log(result);

    await actionLog
      .addDetail(`Qoyod Responded with `, result)
      .setStatus("success")
      .setBody(body)
      .commit();
    return result;
  } catch (e: any) {
    //@ts-ignore
    console.error(e?.response || e);
    await actionLog.setStatus("fail", e).setBody(body).commit();
    throw e;
  }
};
