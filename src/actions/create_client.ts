import Repzo from "repzo";
import { EVENT, Config } from "../types";
import { _fetch, _create, _update, _delete } from "../util.js";
import { Service } from "repzo/src/types";
import { v4 as uuid } from "uuid";

interface QoyodClient {
  contact: {
    name: string;
    organization?: string;
    email?: string;
    phone_number?: string;
    status?: "Active" | "Inactive";
  };
}

export const create_client = async (event: EVENT, options: Config) => {
  const repzo = new Repzo(options.data?.repzoApiKey, { env: options.env });
  const action_sync_id: string = event?.headers?.action_sync_id || uuid();
  const actionLog = new Repzo.ActionLogs(repzo, action_sync_id);
  try {
    console.log("create_client");
    await actionLog.load(action_sync_id);
    await actionLog.addDetail(`Repzo Qoyod: Started Create Client`).commit();

    let body: Service.Client.ClientSchema | any = event.body;
    try {
      if (body) body = JSON.parse(body);
    } catch (e) {}

    const result = { created: 0, failed: 0, failed_msg: [] };

    const repzo_client: Service.Client.ClientSchema = body;

    const qoyod_client_body: QoyodClient = {
      contact: {
        name: repzo_client.name,
        // organization?: string;
        email: repzo_client.email,
        phone_number: repzo_client.phone,
        status: repzo_client.disabled ? "Inactive" : "Active",
      },
    };

    console.dir(qoyod_client_body, { depth: null });

    const qoyod_client = await _create(
      options.serviceEndPoint,
      "/customers",
      qoyod_client_body,
      { "API-KEY": options.data.serviceApiKey }
    );

    console.log(qoyod_client);
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
