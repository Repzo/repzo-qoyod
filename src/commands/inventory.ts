import Repzo from "repzo";
import DataSet from "data-set-query";
import { EVENT, Config, CommandEvent, Result } from "../types";
import {
  _fetch,
  _create,
  _update,
  _delete,
  update_bench_time,
  updateAt_query,
} from "../util.js";
// var config = ;

interface QoyodInventory {
  id: number;
  ar_name: string;
  name: string;
  account_id: number;
  created_at: string; // "2019-10-30T19:56:17.000+03:00",
  updated_at: string; // "2019-10-30T21:51:21.000+03:00",
  address?: {
    id: number;
    shipping_address?: string;
    shipping_city?: string;
    shipping_state?: string;
    shipping_zip?: string;
    shipping_country?: string;
  };
}

interface QoyodInventories {
  inventories: QoyodInventory[];
}

interface WarehouseBody {
  _id?: string;
  name: string;
  type: "van" | "main";
  disabled?: boolean;
  code?: string;
  integration_meta: {
    id: string;
    qoyod_id: number;
    account_id: number;
  };
}

export const sync_inventory = async (commandEvent: CommandEvent) => {
  try {
    console.log("sync_inventory");
    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_inventory";

    const nameSpace = commandEvent.nameSpace.join("_");
    const result: Result = {
      qoyod_total: 0,
      repzo_total: 0,
      created: 0,
      updated: 0,
      failed: 0,
      failed_msg: [],
    };

    const qoyod_inventories: QoyodInventories = await get_qoyod_inventories(
      commandEvent.app.available_app.app_settings.serviceEndPoint,
      commandEvent.app.formData.serviceApiKey,
      updateAt_query("", commandEvent.app.options_formData, bench_time_key)
    );
    result.qoyod_total = qoyod_inventories?.inventories?.length;

    const db = new DataSet([], { autoIndex: false });
    db.createIndex({
      id: true,
      ar_name: true,
      name: true,
      account_id: true,
    });
    db.load(qoyod_inventories?.inventories);

    const inventory_query = qoyod_inventories?.inventories.map(
      (inventory: QoyodInventory) => `${nameSpace}_${inventory.id}`
    ); // ??

    const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
      env: commandEvent.env,
    });
    const repzo_inventories = await repzo.warehouse.find({
      "integration_meta.id": inventory_query,
    });
    result.repzo_total = repzo_inventories?.data?.length;
    for (let i = 0; i < qoyod_inventories.inventories.length; i++) {
      const qoyod_inventory: QoyodInventory = qoyod_inventories.inventories[i];
      const repzo_inventory = repzo_inventories.data.find(
        (r_inventory) =>
          r_inventory.integration_meta?.id ==
          `${nameSpace}_${qoyod_inventory.id}`
      );

      const body: WarehouseBody = {
        _id: repzo_inventory?._id,
        name: qoyod_inventory.name,
        type: "main", // "van" | "main"
        disabled: false,
        code: "" + qoyod_inventory.id,
        integration_meta: {
          id: `${nameSpace}_${qoyod_inventory.id}`,
          qoyod_id: qoyod_inventory.id,
          account_id: qoyod_inventory.account_id,
        },
      };

      if (!repzo_inventory) {
        // Create
        try {
          const created_inventory = await repzo.warehouse.create(body);
          result.created++;
        } catch (e: any) {
          console.log("Create inventory Failed >> ", e?.response, body);
          result.failed++;
        }
      } else {
        const found_identical_docs = db.search({
          id: repzo_inventory.integration_meta?.qoyod_id,
          name: repzo_inventory.name,
          account_id: repzo_inventory.integration_meta?.account_id,
        });
        if (found_identical_docs.length) continue;
        // Update
        try {
          const updated_inventory = await repzo.warehouse.update(
            repzo_inventory._id,
            body
          );
          result.updated++;
        } catch (e) {
          console.log("Update inventory Failed >> ", e, body);
          result.failed++;
        }
      }
    }

    console.log(result);

    await update_bench_time(
      repzo,
      commandEvent.app._id,
      bench_time_key,
      new_bench_time
    );

    return result;
  } catch (e: any) {
    //@ts-ignore
    console.error(e?.response?.data);
    throw e?.response;
  }
};

const get_qoyod_inventories = async (
  serviceEndPoint: string,
  serviceApiKey: string,
  query?: string
): Promise<QoyodInventories> => {
  try {
    const qoyod_inventories: QoyodInventories = await _fetch(
      serviceEndPoint,
      `/inventories${query ? query : ""}`,
      { "API-KEY": serviceApiKey }
    );
    if (!qoyod_inventories.hasOwnProperty("inventories"))
      qoyod_inventories.inventories = [];
    return qoyod_inventories;
  } catch (e: any) {
    if (e.response.status == 404) return { inventories: [] };
    throw e;
  }
};
