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

export interface QoyodClient {
  id: number;
  name: string;
  organization?: string;
  email?: string;
  phone_number?: string;
  tax_number?: string;
  status: "Active" | "Inactive";
  created_at?: string; // "2023-10-26T10:42:52.000+03:00",
  updated_at?: string; // "2023-10-26T10:42:52.000+03:00",
}

interface QoyodClients {
  customers: QoyodClient[];
}

export const addClients = async (commandEvent: CommandEvent) => {
  const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
    env: commandEvent.env,
  });
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
    const result: Result = {
      qoyod_total: 0,
      repzo_total: 0,
      created: 0,
      updated: 0,
      failed: 0,
    };
    const failed_docs_report: FailedDocsReport = [];

    const qoyod_clients: QoyodClients = await get_qoyod_clients(
      commandEvent.app.available_app.app_settings.serviceEndPoint,
      commandEvent.app.formData.serviceApiKey,
      updateAt_query(
        "?q[status_eq]=Active",
        commandEvent.app.options_formData,
        bench_time_key
      )
    );
    result.qoyod_total = qoyod_clients?.customers?.length;
    await commandLog
      .addDetail(
        `${qoyod_clients?.customers?.length} clients changed since ${
          commandEvent.app.options_formData[bench_time_key] || "ever"
        }`
      )
      .commit();

    const db = new DataSet([], { autoIndex: false });
    db.createIndex({
      id: true,
      name: true,
      email: true,
      phone_number: true,
      tax_number: true,
      status: true,
    });
    db.load(qoyod_clients?.customers);

    const client_meta = qoyod_clients?.customers.map(
      (client: QoyodClient) => `${nameSpace}_${client.id}`
    ); // ??

    const repzo_clients = await repzo.client.find({
      per_page: 50000,
      project: ["_id", "integration_meta"],
    });
    result.repzo_total = repzo_clients?.data?.length;
    await commandLog
      .addDetail(
        `${repzo_clients?.data?.length} clients in Repzo was matched the integration.id`
      )
      .commit();

    for (let i = 0; i < qoyod_clients.customers.length; i++) {
      const qoyod_client: QoyodClient = qoyod_clients.customers[i];
      const repzo_client = repzo_clients.data.find(
        (r_client) =>
          r_client.integration_meta?.id == `${nameSpace}_${qoyod_client.id}`
      );

      const body = {
        _id: repzo_client?._id,
        name: qoyod_client.name,
        client_code: "" + qoyod_client.id, // ????
        disabled: qoyod_client.status == "Active" ? false : true,
        // organization is it the chain ????
        // cell_phone: qoyod_client.phone_number,
        phone: qoyod_client.phone_number, // ????????
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
        } catch (e: any) {
          console.log("Create Client Failed >> ", e?.response, body);
          failed_docs_report.push({
            method: "create",
            doc: body,
            error_message: set_error(e),
          });
          result.failed++;
        }
      } else {
        const repzo_origin_doc = await repzo.client.get(repzo_client._id);
        const found_identical_docs = db.search(
          from_repzo_to_qoyod(repzo_origin_doc)
        );
        if (found_identical_docs.length) continue;
        // Update
        try {
          const updated_client = await repzo.client.update(
            repzo_client._id,
            body
          );
          result.updated++;
        } catch (e: any) {
          console.log("Update Client Failed >> ", e?.response?.data || e, body);
          failed_docs_report.push({
            method: "update",
            doc_id: repzo_client?._id,
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
    throw e;
  }
};

export const updatedInactiveClients = async (commandEvent: CommandEvent) => {
  const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
    env: commandEvent.env,
  });
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
    const result: {
      qoyod_total: number;
      repzo_total: number;
      disabled: number;
      failed: number;
    } = { qoyod_total: 0, repzo_total: 0, disabled: 0, failed: 0 };
    const failed_docs_report: FailedDocsReport = [];

    const qoyod_clients: QoyodClients = await get_qoyod_clients(
      commandEvent.app.available_app.app_settings.serviceEndPoint,
      commandEvent.app.formData.serviceApiKey,
      updateAt_query(
        "?q[status_eq]=Inactive",
        commandEvent.app.options_formData,
        bench_time_key
      )
    );
    result.qoyod_total = qoyod_clients?.customers?.length;
    await commandLog
      .addDetail(
        `${qoyod_clients?.customers?.length} clients changed since ${
          commandEvent.app.options_formData[bench_time_key] || "ever"
        }`
      )
      .commit();

    // Build repzo_clients array in batches to avoid 414 Request-URI Too Large error
    const pageSize = 100;
    const repzo_clients_data: any[] = [];
    
    for (let page = 0; page < Math.ceil(qoyod_clients.customers.length / pageSize); page++) {
      const start = page * pageSize;
      const end = Math.min(start + pageSize, qoyod_clients.customers.length);
      const batch_clients = qoyod_clients.customers.slice(start, end);
      
      const client_meta_batch = batch_clients.map(
        (client: QoyodClient) => `${nameSpace}_${client.id}`
      );

      const repzo_clients_batch = await repzo.client.find({
        "integration_meta.id": client_meta_batch,
        per_page: 50000,
      });
      
      if (repzo_clients_batch?.data) {
        repzo_clients_data.push(...repzo_clients_batch.data);
      }
    }
    
    const repzo_clients = { data: repzo_clients_data };
    result.repzo_total = repzo_clients?.data?.length;
    await commandLog
      .addDetail(
        `${repzo_clients?.data?.length} clients in Repzo was matched the integration.id`
      )
      .commit();

    for (let i = 0; i < qoyod_clients.customers.length; i++) {
      const qoyod_client: QoyodClient = qoyod_clients.customers[i];
      const repzo_client = repzo_clients.data.find(
        (r_client) =>
          r_client.integration_meta?.id == `${nameSpace}_${qoyod_client.id}`
      );

      if (repzo_client) {
        // Disabled
        try {
          const disabled_client = await repzo.client.remove(repzo_client._id);
          result.disabled++;
        } catch (e: any) {
          console.log("Disable Client Failed >> ", e);
          failed_docs_report.push({
            method: "update",
            doc_id: repzo_client?._id,
            doc: { client_id: repzo_client._id },
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
    throw e;
  }
};

const get_qoyod_clients = async (
  serviceEndPoint: string,
  serviceApiKey: string,
  query?: string
): Promise<QoyodClients> => {
  try {
    const qoyod_clients: QoyodClients = await _fetch(
      serviceEndPoint,
      `/customers${query ? query : ""}`,
      { "API-KEY": serviceApiKey }
    );
    if (!qoyod_clients.hasOwnProperty("customers"))
      qoyod_clients.customers = [];
    return qoyod_clients;
  } catch (e: any) {
    if (e.response.status == 404) return { customers: [] };
    throw e;
  }
};

const from_repzo_to_qoyod = (repzo_client: any): QoyodClient => {
  try {
    return {
      id: repzo_client.integration_meta?.qoyod_id,
      name: repzo_client.name,
      email: repzo_client.email,
      phone_number: repzo_client.phone,
      tax_number: repzo_client.tax_number,
      status: repzo_client.disabled ? "Inactive" : "Active",
    };
  } catch (e) {
    throw e;
  }
};
