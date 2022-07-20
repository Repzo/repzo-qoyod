import Repzo from "repzo";
import { EVENT, Config } from "../types";
import { _fetch, _create, _update, _delete } from "../util.js";
import { Service } from "repzo/src/types";
import { v4 as uuid } from "uuid";
import moment from "moment-timezone";

interface QoyodTransferItem {
  product_id: string; // product_id
  quantity: string;
}

interface QoyodTransfer {
  inventory_transfer: {
    reference: string;
    from_location: string; // warehouse_id
    to_location: string; // warehouse_id
    date: string; // "YYYY-MM-DD"
    description: string;
    line_items: QoyodTransferItem[];
  };
}

export const create_transfer = async (event: EVENT, options: Config) => {
  const repzo = new Repzo(options.data?.repzoApiKey, { env: options.env });
  const action_sync_id: string = event?.headers?.action_sync_id || uuid();
  const actionLog = new Repzo.ActionLogs(repzo, action_sync_id);
  let body: Service.Transfer.Schema | any;
  try {
    // console.log("create_transfer");
    await actionLog.load(action_sync_id);

    body = event.body;
    try {
      if (body) body = JSON.parse(body);
    } catch (e) {}

    await actionLog
      .addDetail(
        `Repzo Qoyod: Started Create Transfer - ${body?.serial_number?.formatted}`
      )
      .commit();

    const repzo_transfer = body;

    if (typeof repzo_transfer.from == "string") {
      const repzo_transfer_FROM_warehouse: Service.Warehouse.WarehouseSchema =
        await repzo.warehouse.get(repzo_transfer.from);
      if (!repzo_transfer_FROM_warehouse?.integration_meta?.qoyod_id)
        throw new Error(
          `Sync Transfer Failed >> transfer.from: ${repzo_transfer.from} - ${repzo_transfer_FROM_warehouse?.name} was missed the integration.qoyod_id`
        );

      repzo_transfer.from = repzo_transfer_FROM_warehouse;
    }

    if (typeof repzo_transfer.to == "string") {
      const repzo_transfer_TO_warehouse = await repzo.warehouse.get(
        repzo_transfer.to
      );
      if (!repzo_transfer_TO_warehouse?.integration_meta?.qoyod_id)
        throw new Error(
          `Sync Transfer Failed >> transfer.to: ${repzo_transfer.to} - ${repzo_transfer_TO_warehouse?.name} was missed the integration.qoyod_id`
        );

      repzo_transfer.to = repzo_transfer_TO_warehouse;
    }

    const repzo_transfer_variant_ids: { [key: string]: boolean } = {};

    repzo_transfer.variants.forEach(
      (variant: Service.Transfer.VariantTransfer) => {
        repzo_transfer_variant_ids[variant.variant_id] = true;
      }
    );

    const repzo_variants = await repzo.variant.find({
      _id: Object.keys(repzo_transfer_variant_ids),
    });

    const qoyod_transfer_items: QoyodTransferItem[] = [];
    for (let i = 0; i < repzo_transfer.variants.length; i++) {
      const repzo_item = repzo_transfer.variants[i];
      const repzo_variant = repzo_variants.data.find(
        (variant) => variant._id == repzo_item.variant_id
      );
      if (!repzo_variant?.integration_meta?.qoyod_id)
        throw new Error(
          `Sync Transfer Failed >> transfer.variant_id ${repzo_item.variant_id} was missed the integration.qoyod_id`
        );

      qoyod_transfer_items.push({
        product_id: repzo_variant?.integration_meta?.qoyod_id,
        quantity: "" + repzo_item.qty,
      });
    }

    const qoyod_transfer_body: QoyodTransfer = {
      inventory_transfer: {
        reference: repzo_transfer?.serial_number?.formatted,
        from_location: repzo_transfer.from.integration_meta?.qoyod_id,
        to_location: repzo_transfer.to.integration_meta?.qoyod_id,
        date: moment(repzo_transfer.time, "x").format("YYYY-MM-DD"), // timezone ??
        description: repzo_transfer.serial_number.formatted,
        line_items: qoyod_transfer_items,
      },
    };

    // actionLog.setMeta(qoyod_transfer_body);
    // console.dir(qoyod_transfer_body, { depth: null });
    await actionLog
      .addDetail(
        `Repzo Qoyod: Transfer - ${qoyod_transfer_body?.inventory_transfer?.reference}`,
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
  } catch (e: any) {
    //@ts-ignore
    console.error(e?.response || e);
    await actionLog.setStatus("fail", e).setBody(body).commit();
    throw e;
  }
};
