import Repzo from "repzo";
import DataSet from "data-set-query";
import { _fetch, update_bench_time, updateAt_query } from "../util.js";
export const sync_inventory = async (commandEvent) => {
  var _a, _b, _c, _d, _e, _f;
  try {
    console.log("sync_inventory");
    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_inventory";
    const nameSpace = commandEvent.nameSpace.join("_");
    const result = {
      qoyod_total: 0,
      repzo_total: 0,
      created: 0,
      updated: 0,
      failed: 0,
      failed_msg: [],
    };
    const qoyod_inventories = await get_qoyod_inventories(
      commandEvent.app.available_app.app_settings.serviceEndPoint,
      commandEvent.app.formData.serviceApiKey,
      updateAt_query("", commandEvent.app.options_formData, bench_time_key)
    );
    result.qoyod_total =
      (_a =
        qoyod_inventories === null || qoyod_inventories === void 0
          ? void 0
          : qoyod_inventories.inventories) === null || _a === void 0
        ? void 0
        : _a.length;
    const db = new DataSet([], { autoIndex: false });
    db.createIndex({
      id: true,
      ar_name: true,
      name: true,
      account_id: true,
    });
    db.load(
      qoyod_inventories === null || qoyod_inventories === void 0
        ? void 0
        : qoyod_inventories.inventories
    );
    const inventory_query =
      qoyod_inventories === null || qoyod_inventories === void 0
        ? void 0
        : qoyod_inventories.inventories.map(
            (inventory) => `${nameSpace}_${inventory.id}`
          ); // ??
    const repzo = new Repzo(
      (_b = commandEvent.app.formData) === null || _b === void 0
        ? void 0
        : _b.repzoApiKey,
      {
        env: commandEvent.env,
      }
    );
    const repzo_inventories = await repzo.warehouse.find({
      "integration_meta.id": inventory_query,
    });
    result.repzo_total =
      (_c =
        repzo_inventories === null || repzo_inventories === void 0
          ? void 0
          : repzo_inventories.data) === null || _c === void 0
        ? void 0
        : _c.length;
    for (let i = 0; i < qoyod_inventories.inventories.length; i++) {
      const qoyod_inventory = qoyod_inventories.inventories[i];
      const repzo_inventory = repzo_inventories.data.find((r_inventory) => {
        var _a;
        return (
          ((_a = r_inventory.integration_meta) === null || _a === void 0
            ? void 0
            : _a.id) == `${nameSpace}_${qoyod_inventory.id}`
        );
      });
      const body = {
        _id:
          repzo_inventory === null || repzo_inventory === void 0
            ? void 0
            : repzo_inventory._id,
        name: qoyod_inventory.name,
        type: "main",
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
        } catch (e) {
          console.log(
            "Create inventory Failed >> ",
            e === null || e === void 0 ? void 0 : e.response,
            body
          );
          result.failed++;
        }
      } else {
        const found_identical_docs = db.search({
          id:
            (_d = repzo_inventory.integration_meta) === null || _d === void 0
              ? void 0
              : _d.qoyod_id,
          name: repzo_inventory.name,
          account_id:
            (_e = repzo_inventory.integration_meta) === null || _e === void 0
              ? void 0
              : _e.account_id,
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
    // console.log(result);
    await update_bench_time(
      repzo,
      commandEvent.app._id,
      bench_time_key,
      new_bench_time
    );
    return result;
  } catch (e) {
    //@ts-ignore
    console.error(
      (_f = e === null || e === void 0 ? void 0 : e.response) === null ||
        _f === void 0
        ? void 0
        : _f.data
    );
    throw e === null || e === void 0 ? void 0 : e.response;
  }
};
const get_qoyod_inventories = async (serviceEndPoint, serviceApiKey, query) => {
  try {
    const qoyod_inventories = await _fetch(
      serviceEndPoint,
      `/inventories${query ? query : ""}`,
      { "API-KEY": serviceApiKey }
    );
    if (!qoyod_inventories.hasOwnProperty("inventories"))
      qoyod_inventories.inventories = [];
    return qoyod_inventories;
  } catch (e) {
    if (e.response.status == 404) return { inventories: [] };
    throw e;
  }
};
