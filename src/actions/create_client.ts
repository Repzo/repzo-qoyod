import Repzo from "repzo";
import { EVENT, Config } from "../types";
import { _fetch, _create, _update, _delete, set_error } from "../util.js";
import { Service } from "repzo/src/types";
import { v4 as uuid } from "uuid";
import { QoyodClient as QoyodClientResult } from "../commands/client";

interface QoyodClient {
  contact: {
    name: string;
    organization?: string;
    email?: string;
    phone_number?: string;
    status?: "Active" | "Inactive";
    tax_number?: string;
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

    if (body.integration_meta?.qoyod_id || body.integration_meta?.id) {
      // Already created
      await actionLog
        .addDetail(
          `Client ${body?.name} already exists in Qoyod with _id: ${
            body?.integration_meta?.qoyod_id || body?.integration_meta?.id
          }`
        )
        .setStatus("success", null)
        .commit();
    }

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
        tax_number: repzo_client.tax_number,
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

    const result: { contact: QoyodClientResult } = (await _create(
      options.serviceEndPoint,
      "/customers",
      qoyod_client_body,
      { "API-KEY": options.data.serviceApiKey }
    )) as unknown as { contact: QoyodClientResult };

    // console.log(result);

    // Update
    const failed_docs_report = [];
    try {
      const updated_client = await repzo.client.update(repzo_client._id, {
        integration_meta: {
          id: `${repzo_client.company_namespace[0]}_${result.contact.id}`,
          qoyod_id: result.contact.id,
        },
      });
    } catch (e: any) {
      console.log("Update Client Failed >> ", e?.response?.data || e, body);
      failed_docs_report.push({
        method: "update",
        doc_id: repzo_client?._id,
        doc: body,
        qoyod_id: result.contact?.id,
        error_message: set_error(e),
      });
    }

    await actionLog
      .addDetail(`Qoyod Responded with `, result)
      .addDetail(`Repzo Qoyod: Client - ${qoyod_client_body?.contact?.name}`)
      .setStatus(
        "success",
        failed_docs_report.length ? failed_docs_report : null
      )
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
