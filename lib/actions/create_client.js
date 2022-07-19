import Repzo from "repzo";
import { _create } from "../util.js";
import { v4 as uuid } from "uuid";
export const create_client = async (event, options) => {
  var _a, _b, _c, _d;
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
    // console.log("create_client");
    await actionLog.load(action_sync_id);
    body = event.body;
    try {
      if (body) body = JSON.parse(body);
    } catch (e) {}
    await actionLog
      .addDetail(
        `Repzo Qoyod: Started Create Client - ${
          (_c =
            body === null || body === void 0 ? void 0 : body.serial_number) ===
            null || _c === void 0
            ? void 0
            : _c.formatted
        }`
      )
      .commit();
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
    // actionLog.setMeta(qoyod_client_body);
    // console.dir(qoyod_client_body, { depth: null });
    await actionLog
      .addDetail(
        `Repzo Qoyod: Client Body - ${
          (_d =
            qoyod_client_body === null || qoyod_client_body === void 0
              ? void 0
              : qoyod_client_body.contact) === null || _d === void 0
            ? void 0
            : _d.name
        }`,
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
  } catch (e) {
    //@ts-ignore
    console.error((e === null || e === void 0 ? void 0 : e.response) || e);
    await actionLog.setStatus("fail", e).setBody(body).commit();
    throw e;
  }
};
