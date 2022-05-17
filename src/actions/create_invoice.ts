import Repzo from "repzo";
import DataSet from "data-set-query";
import { EVENT, Config, CommandEvent } from "../types";
import { _fetch, _create, _update, _delete } from "../util.js";
import { Service } from "repzo/src/types";

interface QoyodInvoiceItem {
  product_id: number; // product_id
  description?: string;
  quantity: number;
  unit_price: number; // not fils
  unit_type: number; // measureunit_id
  discount?: number;
  discount_type?: "percentage" | "amount"; // default percentage
  tax_percent?: number;
  is_inclusive?: boolean;
}

interface QoyodInvoice {
  invoice: {
    contact_id: number; // client_id
    reference: string; // serial_number
    description?: string;
    issue_date: string;
    due_date: string;
    status: "Draft" | "Approved";
    inventory_id: number; // warehouse_id
    line_items: QoyodInvoiceItem[];
    draft_if_out_of_stock?: boolean;
    custom_fields?: {
      [key: string]: string;
    };
  };
}

export const create_invoice = async (event: EVENT, options: Config) => {
  try {
    console.log("create_invoice");
    let body: Service.FullInvoice.InvoiceSchema | any = event.body;
    try {
      if (body) body = JSON.parse(body);
    } catch (e) {}

    const result = { created: 0, failed: 0 };

    const repzo = new Repzo(options.data?.repzoApiKey, { env: options.env });
    const repzo_invoice = body;

    const qoyod_client = await repzo.client.get(repzo_invoice.client_id);
    if (!qoyod_client.integration_meta?.qoyod_id)
      throw new Error(
        `Sync Invoice Failed >> invoice.client was missed the integration.qoyod_id`,
      );

    const repzo_invoice_warehouse = await repzo.warehouse.get(
      repzo_invoice.origin_warehouse,
    );
    if (!repzo_invoice_warehouse.integration_meta?.qoyod_id)
      throw new Error(
        `Sync Invoice Failed >> invoice.origin_warehouse was missed the integration.qoyod_id`,
      );

    const repzo_invoice_variant_ids: any = {};
    const repzo_invoice_measureunit_ids: any = {};

    repzo_invoice.items.forEach((item: Service.Item.Schema) => {
      repzo_invoice_variant_ids[item.variant.variant_id] = true;
      repzo_invoice_measureunit_ids[item.measureunit._id] = true;
    });

    const repzo_variants = await repzo.variant.find({
      _id: Object.keys(repzo_invoice_variant_ids),
    });

    const repzo_measureunits = await repzo.measureunit.find({
      _id: Object.keys(repzo_invoice_measureunit_ids),
    });

    const qoyod_invoice_items: QoyodInvoiceItem[] = [];
    for (let i = 0; i < repzo_invoice.items.length; i++) {
      const repzo_item = repzo_invoice.items[i];
      const repzo_variant = repzo_variants.data.find(
        (variant) => variant._id == repzo_item.variant.variant_id,
      );
      if (!repzo_variant?.integration_meta?.qoyod_id)
        throw new Error(
          `Sync Invoice Failed >> invoice.item.variant ${repzo_item.variant.variant_id} was missed the integration.qoyod_id`,
        );

      const repzo_measureunit = repzo_measureunits.data.find(
        (unit) => unit._id == repzo_item.measureunit._id,
      );
      if (!repzo_measureunit?.integration_meta?.qoyod_id)
        throw new Error(
          `Sync Invoice Failed >> invoice.item.measureunit ${repzo_item.measureunit._id} was missed the integration.qoyod_id`,
        );

      qoyod_invoice_items.push({
        product_id: repzo_variant?.integration_meta?.qoyod_id,
        description: "",
        quantity: repzo_item.qty,
        unit_price: repzo_item.discounted_price / 1000,
        unit_type: repzo_measureunit?.integration_meta?.qoyod_id,
        // discount: repzo_item.discount_value,
        // discount_type: "amount", // "percentage" | "amount"; // default percentage
        tax_percent: repzo_item.tax.rate * 100,
        is_inclusive: repzo_item.tax.type == "inclusive",
      });
    }

    const qoyod_invoice_body: QoyodInvoice = {
      invoice: {
        contact_id: qoyod_client.integration_meta?.qoyod_id, // (repzo_invoice.client_id as any).integration_meta?.qoyod_id,
        reference: repzo_invoice.serial_number.formatted,
        description: repzo_invoice.comment,
        issue_date: repzo_invoice.issue_date,
        due_date: repzo_invoice.due_date,
        status: "Approved",
        inventory_id: repzo_invoice_warehouse.integration_meta?.qoyod_id,
        line_items: qoyod_invoice_items,
        draft_if_out_of_stock: true,
      },
    };

    console.dir(qoyod_invoice_body, { depth: null });

    const qoyod_invoice = await _create(
      options.serviceEndPoint,
      "/invoices",
      qoyod_invoice_body,
      { "API-KEY": options.data.serviceApiKey },
    );

    console.log(qoyod_invoice);

    console.log(result);
    return result;
  } catch (e: any) {
    //@ts-ignore
    console.error(e);
    throw e?.response;
  }
};
