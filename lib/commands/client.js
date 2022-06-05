import Repzo from "repzo";
import DataSet from "data-set-query";
import { _fetch, update_bench_time, updateAt_query } from "../util.js";
export const addClients = async (commandEvent) => {
  var _a, _b, _c, _d, _e, _f;
  const repzo = new Repzo(
    (_a = commandEvent.app.formData) === null || _a === void 0
      ? void 0
      : _a.repzoApiKey,
    {
      env: commandEvent.env,
    }
  );
  const commandLog = new Repzo.CommandLog(
    repzo,
    commandEvent.app,
    commandEvent.command
  );
  try {
    console.log("addClients");
    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_client";
    await commandLog.load(commandEvent.sync_id);
    await commandLog.addDetail("Repzo Qoyod: Started Syncing Clients").commit();
    const nameSpace = commandEvent.nameSpace.join("_");
    const result = {
      qoyod_total: 0,
      repzo_total: 0,
      created: 0,
      updated: 0,
      failed: 0,
      failed_msg: [],
    };
    const qoyod_clients = await get_qoyod_clients(
      commandEvent.app.available_app.app_settings.serviceEndPoint,
      commandEvent.app.formData.serviceApiKey,
      updateAt_query(
        "?q[status_eq]=Active",
        commandEvent.app.options_formData,
        bench_time_key
      )
    );
    result.qoyod_total =
      (_b =
        qoyod_clients === null || qoyod_clients === void 0
          ? void 0
          : qoyod_clients.customers) === null || _b === void 0
        ? void 0
        : _b.length;
    await commandLog
      .addDetail(
        `${
          (_c =
            qoyod_clients === null || qoyod_clients === void 0
              ? void 0
              : qoyod_clients.customers) === null || _c === void 0
            ? void 0
            : _c.length
        } clients changed since ${
          commandEvent.app.options_formData[bench_time_key] || "ever"
        }`
      )
      .commit();
    const db = new DataSet([], { autoIndex: false });
    db.createIndex({
      id: true,
      name: true,
      organization: true,
      email: true,
      phone_number: true,
      tax_number: true,
      status: true,
    });
    db.load(
      qoyod_clients === null || qoyod_clients === void 0
        ? void 0
        : qoyod_clients.customers
    );
    const client_meta =
      qoyod_clients === null || qoyod_clients === void 0
        ? void 0
        : qoyod_clients.customers.map((client) => `${nameSpace}_${client.id}`); // ??
    const repzo_clients = await repzo.client.find({
      "integration_meta.id": client_meta,
      // project:["_id", "name", "integration_meta", "disabled", "email", "phone", "tax_number"]
    });
    result.repzo_total =
      (_d =
        repzo_clients === null || repzo_clients === void 0
          ? void 0
          : repzo_clients.data) === null || _d === void 0
        ? void 0
        : _d.length;
    await commandLog
      .addDetail(
        `${
          (_e =
            repzo_clients === null || repzo_clients === void 0
              ? void 0
              : repzo_clients.data) === null || _e === void 0
            ? void 0
            : _e.length
        } clients in Repzo was matched the integration.id`
      )
      .commit();
    for (let i = 0; i < qoyod_clients.customers.length; i++) {
      const qoyod_client = qoyod_clients.customers[i];
      const repzo_client = repzo_clients.data.find((r_client) => {
        var _a;
        return (
          ((_a = r_client.integration_meta) === null || _a === void 0
            ? void 0
            : _a.id) == `${nameSpace}_${qoyod_client.id}`
        );
      });
      const body = {
        _id:
          repzo_client === null || repzo_client === void 0
            ? void 0
            : repzo_client._id,
        name: qoyod_client.name,
        client_code: "" + qoyod_client.id,
        disabled: qoyod_client.status == "Active" ? false : true,
        // organization is it the chain ????
        // cell_phone: qoyod_client.phone_number,
        phone: qoyod_client.phone_number,
        email: qoyod_client.email,
        tax_number: qoyod_client.tax_number,
        integration_meta: {
          id: `${nameSpace}_${qoyod_client.id}`,
          qoyod_id: qoyod_client.id,
        },
      };
      if (!repzo_client) {
        // Create
        try {
          const created_client = await repzo.client.create(body);
          result.created++;
        } catch (e) {
          console.log(
            "Create Client Failed >> ",
            e === null || e === void 0 ? void 0 : e.response,
            body
          );
          result.failed_msg.push(
            "Create Client Failed >> ",
            e === null || e === void 0 ? void 0 : e.response,
            body
          );
          result.failed++;
        }
      } else {
        const found_identical_docs = db.search(
          from_repzo_to_qoyod(repzo_client)
        );
        if (found_identical_docs.length) continue;
        // Update
        try {
          const updated_client = await repzo.client.update(
            repzo_client._id,
            body
          );
          result.updated++;
        } catch (e) {
          console.log("Update Client Failed >> ", e, body);
          result.failed_msg.push(
            "Update Client Failed >> ",
            e === null || e === void 0 ? void 0 : e.response,
            body
          );
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
    await commandLog.setStatus("success").setBody(result).commit();
    return result;
  } catch (e) {
    //@ts-ignore
    console.error(
      (_f = e === null || e === void 0 ? void 0 : e.response) === null ||
        _f === void 0
        ? void 0
        : _f.data
    );
    await commandLog.setStatus("fail", e).commit();
    throw e === null || e === void 0 ? void 0 : e.response;
  }
};
export const updatedInactiveClients = async (commandEvent) => {
  var _a, _b, _c, _d, _e;
  const repzo = new Repzo(
    (_a = commandEvent.app.formData) === null || _a === void 0
      ? void 0
      : _a.repzoApiKey,
    {
      env: commandEvent.env,
    }
  );
  const commandLog = new Repzo.CommandLog(
    repzo,
    commandEvent.app,
    commandEvent.command
  );
  try {
    console.log("updatedInactiveClients");
    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_disabled_client";
    await commandLog.load(commandEvent.sync_id);
    await commandLog
      .addDetail("Repzo Qoyod: Started Syncing Disabled Clients")
      .commit();
    const nameSpace = commandEvent.nameSpace.join("_");
    const result = {
      qoyod_total: 0,
      repzo_total: 0,
      disabled: 0,
      failed: 0,
      failed_msg: [],
    };
    const qoyod_clients = await get_qoyod_clients(
      commandEvent.app.available_app.app_settings.serviceEndPoint,
      commandEvent.app.formData.serviceApiKey,
      updateAt_query(
        "?q[status_eq]=Inactive",
        commandEvent.app.options_formData,
        bench_time_key
      )
    );
    result.qoyod_total =
      (_b =
        qoyod_clients === null || qoyod_clients === void 0
          ? void 0
          : qoyod_clients.customers) === null || _b === void 0
        ? void 0
        : _b.length;
    await commandLog
      .addDetail(
        `${
          (_c =
            qoyod_clients === null || qoyod_clients === void 0
              ? void 0
              : qoyod_clients.customers) === null || _c === void 0
            ? void 0
            : _c.length
        } clients changed since ${
          commandEvent.app.options_formData[bench_time_key] || "ever"
        }`
      )
      .commit();
    const client_meta =
      qoyod_clients === null || qoyod_clients === void 0
        ? void 0
        : qoyod_clients.customers.map((client) => `${nameSpace}_${client.id}`); // ??
    const repzo_clients = await repzo.client.find({
      "integration_meta.id": client_meta,
    });
    result.repzo_total =
      (_d =
        repzo_clients === null || repzo_clients === void 0
          ? void 0
          : repzo_clients.data) === null || _d === void 0
        ? void 0
        : _d.length;
    await commandLog
      .addDetail(
        `${
          (_e =
            repzo_clients === null || repzo_clients === void 0
              ? void 0
              : repzo_clients.data) === null || _e === void 0
            ? void 0
            : _e.length
        } clients in Repzo was matched the integration.id`
      )
      .commit();
    for (let i = 0; i < qoyod_clients.customers.length; i++) {
      const qoyod_client = qoyod_clients.customers[i];
      const repzo_client = repzo_clients.data.find((r_client) => {
        var _a;
        return (
          ((_a = r_client.integration_meta) === null || _a === void 0
            ? void 0
            : _a.id) == `${nameSpace}_${qoyod_client.id}`
        );
      });
      if (repzo_client) {
        // Disabled
        try {
          const disabled_client = await repzo.client.remove(repzo_client._id);
          result.disabled++;
        } catch (e) {
          console.log("Disable Client Failed >> ", e);
          result.failed_msg.push(
            "Disable Client Failed >> ",
            e === null || e === void 0 ? void 0 : e.response,
            {
              client_id: repzo_client._id,
            }
          );
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
    await commandLog.setStatus("success").setBody(result).commit();
    return result;
  } catch (e) {
    //@ts-ignore
    console.error(e);
    await commandLog.setStatus("fail", e).commit();
    throw e;
  }
};
const get_qoyod_clients = async (serviceEndPoint, serviceApiKey, query) => {
  try {
    const qoyod_clients = await _fetch(
      serviceEndPoint,
      `/customers${query ? query : ""}`,
      { "API-KEY": serviceApiKey }
    );
    if (!qoyod_clients.hasOwnProperty("customers"))
      qoyod_clients.customers = [];
    return qoyod_clients;
  } catch (e) {
    if (e.response.status == 404) return { customers: [] };
    throw e;
  }
};
const from_repzo_to_qoyod = (repzo_client) => {
  var _a;
  try {
    return {
      id:
        (_a = repzo_client.integration_meta) === null || _a === void 0
          ? void 0
          : _a.qoyod_id,
      name: repzo_client.name,
      organization: "",
      email: repzo_client.email,
      phone_number: repzo_client.phone,
      tax_number: repzo_client.tax_number,
      status: repzo_client.disabled ? "Inactive" : "Active",
    };
  } catch (e) {
    throw e;
  }
};
