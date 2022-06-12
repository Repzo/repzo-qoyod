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
    from_location: string; // warehouse_id
    to_location: string; // warehouse_id
    date: string; // "YYYY-MM-DD"
    description: string;
    line_items: QoyodTransferItem[];
  };
}

export const create_transfer = async (event: EVENT, options: Config) => {
  console.log("*".repeat(20));

  const repzo = new Repzo(options.data?.repzoApiKey, { env: options.env });
  const action_sync_id: string = event?.headers?.action_sync_id || uuid();
  const actionLog = new Repzo.ActionLogs(repzo, action_sync_id);
  try {
    console.log("create_transfer");
    await actionLog.load(action_sync_id);
    await actionLog.addDetail(`Repzo Qoyod: Started Create Transfer`).commit();

    let body: Service.Transfer.Schema | any = event.body;
    try {
      if (body) body = JSON.parse(body);
    } catch (e) {}

    const result = { created: 0, failed: 0, failed_msg: [] };

    const repzo_transfer = body;

    if (typeof repzo_transfer.from == "string") {
      const repzo_transfer_FROM_warehouse: Service.Warehouse.WarehouseSchema =
        await repzo.warehouse.get(repzo_transfer.from);
      if (!repzo_transfer_FROM_warehouse?.integration_meta?.qoyod_id)
        throw new Error(
          `Sync Transfer Failed >> transfer.from was missed the integration.qoyod_id`
        );

      repzo_transfer.from = repzo_transfer_FROM_warehouse;
    }

    if (typeof repzo_transfer.to == "string") {
      const repzo_transfer_TO_warehouse = await repzo.warehouse.get(
        repzo_transfer.to
      );
      if (!repzo_transfer_TO_warehouse?.integration_meta?.qoyod_id)
        throw new Error(
          `Sync Transfer Failed >> transfer.to was missed the integration.qoyod_id`
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
        from_location: repzo_transfer.from.integration_meta?.qoyod_id,
        to_location: repzo_transfer.to.integration_meta?.qoyod_id,
        date: moment(repzo_transfer.time, "x").format("YYYY-MM-DD"), // timezone ??
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
    await actionLog.setStatus("success").setBody(result).commit();
    return result;
  } catch (e: any) {
    //@ts-ignore
    console.error(e);
    await actionLog.setStatus("fail", e).commit();
    throw e?.response;
  }
};