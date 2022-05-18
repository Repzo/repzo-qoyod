import Repzo from "repzo";
import DataSet from "data-set-query";
import { EVENT, Config, CommandEvent } from "../types";
import {
  _fetch,
  _create,
  _update,
  _delete,
  update_bench_time,
  updateAt_query,
} from "../util.js";
// var config = ;

interface QoyodClient {
  id: number;
  name: string;
  organization?: string;
  email?: string;
  phone_number?: string;
  tax_number?: string;
  status: "Active" | "Inactive";
}

interface QoyodClients {
  customers: QoyodClient[];
}

export const addClients = async (commandEvent: CommandEvent) => {
  try {
    console.log("addClients");
    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_client";

    const nameSpace = commandEvent.nameSpace.join("_");
    const result = {
      qoyod_total: 0,
      repzo_total: 0,
      created: 0,
      updated: 0,
      failed: 0,
    };

    const qoyod_clients: QoyodClients = await get_qoyod_clients(
      commandEvent.app.available_app.app_settings.serviceEndPoint,
      commandEvent.app.formData.serviceApiKey,
      updateAt_query(
        "?q[status_eq]=Active",
        commandEvent.app.options_formData,
        bench_time_key,
      ),
    );
    result.qoyod_total = qoyod_clients?.customers?.length;

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
    db.load(qoyod_clients?.customers);

    const client_meta = qoyod_clients?.customers.map(
      (client: QoyodClient) => `${nameSpace}_${client.id}`,
    ); // ??

    const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
      env: commandEvent.env,
    });
    const repzo_clients = await repzo.client.find({
      "integration_meta.id": client_meta,
      // project:["_id", "name", "integration_meta", "disabled", "email", "phone", "tax_number"]
    });
    result.repzo_total = repzo_clients?.data?.length;
    for (let i = 0; i < qoyod_clients.customers.length; i++) {
      const qoyod_client: QoyodClient = qoyod_clients.customers[i];
      const repzo_client = repzo_clients.data.find(
        (r_client) =>
          r_client.integration_meta?.id == `${nameSpace}_${qoyod_client.id}`,
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
          console.log("Create Client Failed >> ", e.response, body);
          result.failed++;
        }
      } else {
        const found_identical_docs = db.search(
          from_repzo_to_qoyod(repzo_client),
        );
        if (found_identical_docs.length) continue;
        // Update
        try {
          const updated_client = await repzo.client.update(
            repzo_client._id,
            body,
          );
          result.updated++;
        } catch (e) {
          console.log("Update Client Failed >> ", e, body);
          result.failed++;
        }
      }
    }

    console.log(result);

    await update_bench_time(
      repzo,
      commandEvent.app._id,
      bench_time_key,
      new_bench_time,
    );

    return result;
  } catch (e: any) {
    //@ts-ignore
    console.error(e.response.data);
    throw e?.response;
  }
};

export const updatedInactiveClients = async (commandEvent: CommandEvent) => {
  try {
    console.log("updatedInactiveClients");
    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_disabled_client";

    const nameSpace = commandEvent.nameSpace.join("_");
    const result = {
      qoyod_total: 0,
      repzo_total: 0,
      disabled: 0,
      failed: 0,
    };

    const qoyod_clients: QoyodClients = await get_qoyod_clients(
      commandEvent.app.available_app.app_settings.serviceEndPoint,
      commandEvent.app.formData.serviceApiKey,
      updateAt_query(
        "?q[status_eq]=Inactive",
        commandEvent.app.options_formData,
        bench_time_key,
      ),
    );
    result.qoyod_total = qoyod_clients?.customers?.length;
    const client_meta = qoyod_clients?.customers.map(
      (client: QoyodClient) => `${nameSpace}_${client.id}`,
    ); // ??
    const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
      env: commandEvent.env,
    });
    const repzo_clients = await repzo.client.find({
      "integration_meta.id": client_meta,
    });
    result.repzo_total = repzo_clients?.data?.length;
    for (let i = 0; i < qoyod_clients.customers.length; i++) {
      const qoyod_client: QoyodClient = qoyod_clients.customers[i];
      const repzo_client = repzo_clients.data.find(
        (r_client) =>
          r_client.integration_meta?.id == `${nameSpace}_${qoyod_client.id}`,
      );

      if (repzo_client) {
        // Disabled
        try {
          const disabled_client = await repzo.client.remove(repzo_client._id);
          result.disabled++;
        } catch (e) {
          console.log("Disable Client Failed >> ", e);
          result.failed++;
        }
      }
    }

    console.log(result);

    await update_bench_time(
      repzo,
      commandEvent.app._id,
      bench_time_key,
      new_bench_time,
    );

    return result;
  } catch (e) {
    //@ts-ignore
    console.error(e);
    throw e;
  }
};

const get_qoyod_clients = async (
  serviceEndPoint: string,
  serviceApiKey: string,
  query?: string,
): Promise<QoyodClients> => {
  try {
    const qoyod_clients: QoyodClients = await _fetch(
      serviceEndPoint,
      `/customers${query ? query : ""}`,
      { "API-KEY": serviceApiKey },
    );
    return qoyod_clients;
  } catch (e: any) {
    // code instead of msg
    if (
      e.response.data ==
      "We could not retrieve your customers, we found nothing."
    )
      return { customers: [] };

    throw e;
  }
};

const from_repzo_to_qoyod = (repzo_client: any): QoyodClient => {
  try {
    return {
      id: repzo_client.integration_meta?.qoyod_id,
      name: repzo_client.name,
      organization: "", // ????
      email: repzo_client.email,
      phone_number: repzo_client.phone,
      tax_number: repzo_client.tax_number,
      status: repzo_client.disabled ? "Inactive" : "Active",
    };
  } catch (e) {
    throw e;
  }
};
