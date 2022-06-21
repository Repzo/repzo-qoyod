import Repzo from "repzo";
import { _create } from "../util.js";
import { v4 as uuid } from "uuid";
export const create_client = async (event, options) => {
  var _a, _b;
  const repzo = new Repzo(
    (_a = options.data) === null || _a === void 0 ? void 0 : _a.repzoApiKey,
    { env: options.env }
  );
  const action_sync_id =
    ((_b = event === null || event === void 0 ? void 0 : event.headers) ===
      null || _b === void 0
      ? void 0
      : _b.action_sync_id) || uuid();
  const actionLog = new Repzo.ActionLogs(repzo, action_sync_id);
  let body;
  try {
    console.log("create_client");
    await actionLog.load(action_sync_id);
    await actionLog.addDetail(`Repzo Qoyod: Started Create Client`).commit();
    body = event.body;
    try {
      if (body) body = JSON.parse(body);
    } catch (e) {}
    const result = { created: 0, failed: 0, failed_msg: [] };
    const repzo_client = body;
    const qoyod_client_body = {
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
    await actionLog.setStatus("success", result).setBody(body).commit();
    return result;
  } catch (e) {
    //@ts-ignore
    console.error(e);
    await actionLog.setStatus("fail", e).setBody(body).commit();
    throw e === null || e === void 0 ? void 0 : e.response;
  }
};
