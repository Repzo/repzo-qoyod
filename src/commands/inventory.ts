import Repzo from "repzo";
import DataSet from "data-set-query";
import {
  EVENT,
  Config,
  CommandEvent,
  Result,
  FailedDocsReport,
} from "../types";
import {
  _fetch,
  _create,
  _update,
  _delete,
  update_bench_time,
  updateAt_query,
  set_error,
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
  const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
    env: commandEvent.env,
  });
  const commandLog = new Repzo.CommandLog(
    repzo,
    commandEvent.app,
    commandEvent.command
  );
  try {
    console.log("sync_inventory");
    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_inventory";

    await commandLog.load(commandEvent.sync_id);
    await commandLog
      .addDetail("Repzo Qoyod: Started Syncing Warehouses")
      .commit();

    const nameSpace = commandEvent.nameSpace.join("_");
    const result: Result = {
      qoyod_total: 0,
      repzo_total: 0,
      created: 0,
      updated: 0,
      failed: 0,
    };
    const failed_docs_report: FailedDocsReport = [];

    const qoyod_inventories: QoyodInventories = await get_qoyod_inventories(
      commandEvent.app.available_app.app_settings.serviceEndPoint,
      commandEvent.app.formData.serviceApiKey,
      updateAt_query("", commandEvent.app.options_formData, bench_time_key)
    );
    result.qoyod_total = qoyod_inventories?.inventories?.length;

    await commandLog
      .addDetail(
        `${qoyod_inventories?.inventories?.length} warehouses changed since ${
          commandEvent.app.options_formData[bench_time_key] || "ever"
        }`
      )
      .commit();

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

    const repzo_inventories = await repzo.warehouse.find({
      "integration_meta.id": inventory_query,
      per_page: 50000,
    });
    result.repzo_total = repzo_inventories?.data?.length;
    await commandLog
      .addDetail(
        `${repzo_inventories?.data?.length} warehouses in Repzo was matched the integration.id`
      )
      .commit();

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
          failed_docs_report.push({
            method: "create",
            doc: body,
            error_message: set_error(e),
          });
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
          failed_docs_report.push({
            method: "update",
            doc_id: repzo_inventory?._id,
            doc: body,
            error_message: set_error(e),
          });
          result.failed++;
        }
      }
    }

    // console.log(result);

    await update_bench_time(
      repzo,
      commandEvent.app._id,
      bench_time_key,
      new_bench_time
    );
    await commandLog
      .setStatus(
        "success",
        failed_docs_report.length ? failed_docs_report : null
      )
      .setBody(result)
      .commit();

    return result;
  } catch (e: any) {
    //@ts-ignore
    console.error(e?.response?.data || e);
    await commandLog.setStatus("fail", e).commit();
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
