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
  let body: Service.Client.ClientSchema | any;
  try {
    // console.log("create_client");
    await actionLog.load(action_sync_id);

    body = event.body;
    try {
      if (body) body = JSON.parse(body);
    } catch (e) {}

    await actionLog
      .addDetail(
        `Repzo Qoyod: Started Create Client - ${body?.serial_number?.formatted}`
      )
      .commit();

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

    // actionLog.setMeta(qoyod_client_body);
    // console.dir(qoyod_client_body, { depth: null });
    await actionLog
      .addDetail(
        `Repzo Qoyod: Client Body - ${qoyod_client_body?.contact?.name}`,
        qoyod_client_body
      )
      .commit();

    const result = await _create(
      options.serviceEndPoint,
      "/customers",
      qoyod_client_body,
      { "API-KEY": options.data.serviceApiKey }
    );

    // console.log(result);

    await actionLog
      .addDetail(`Qoyod Responded with `, result)
      .setStatus("success")
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
