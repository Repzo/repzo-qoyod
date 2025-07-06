import Repzo from "repzo";
import { _create, set_error } from "../util.js";
import { v4 as uuid } from "uuid";
export const create_client = async (event, options) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
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
    if (
      ((_c = body.integration_meta) === null || _c === void 0
        ? void 0
        : _c.qoyod_id) ||
      ((_d = body.integration_meta) === null || _d === void 0 ? void 0 : _d.id)
    ) {
      // Already created
      await actionLog
        .addDetail(
          `Client ${
            body === null || body === void 0 ? void 0 : body.name
          } already exists in Qoyod with _id: ${
            ((_e =
              body === null || body === void 0
                ? void 0
                : body.integration_meta) === null || _e === void 0
              ? void 0
              : _e.qoyod_id) ||
            ((_f =
              body === null || body === void 0
                ? void 0
                : body.integration_meta) === null || _f === void 0
              ? void 0
              : _f.id)
          }`
        )
        .setStatus("success", null)
        .commit();
    }
    await actionLog
      .addDetail(
        `Repzo Qoyod: Started Create Client - ${
          (_g =
            body === null || body === void 0 ? void 0 : body.serial_number) ===
            null || _g === void 0
            ? void 0
            : _g.formatted
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
        tax_number: repzo_client.tax_number,
      },
    };
    // actionLog.setMeta(qoyod_client_body);
    // console.dir(qoyod_client_body, { depth: null });
    await actionLog
      .addDetail(
        `Repzo Qoyod: Client Body - ${
          (_h =
            qoyod_client_body === null || qoyod_client_body === void 0
              ? void 0
              : qoyod_client_body.contact) === null || _h === void 0
            ? void 0
            : _h.name
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
    // Update
    const failed_docs_report = [];
    try {
      const updated_client = await repzo.client.update(repzo_client._id, {
        integration_meta: {
          id: `${repzo_client.company_namespace[0]}_${result.contact.id}`,
          qoyod_id: result.contact.id,
        },
      });
    } catch (e) {
      console.log(
        "Update Client Failed >> ",
        ((_j = e === null || e === void 0 ? void 0 : e.response) === null ||
        _j === void 0
          ? void 0
          : _j.data) || e,
        body
      );
      failed_docs_report.push({
        method: "update",
        doc_id:
          repzo_client === null || repzo_client === void 0
            ? void 0
            : repzo_client._id,
        doc: body,
        qoyod_id:
          (_k = result.contact) === null || _k === void 0 ? void 0 : _k.id,
        error_message: set_error(e),
      });
    }
    await actionLog
      .addDetail(`Qoyod Responded with `, result)
      .addDetail(
        `Repzo Qoyod: Client - ${
          (_l =
            qoyod_client_body === null || qoyod_client_body === void 0
              ? void 0
              : qoyod_client_body.contact) === null || _l === void 0
            ? void 0
            : _l.name
        }`
      )
      .setStatus(
        "success",
        failed_docs_report.length ? failed_docs_report : null
      )
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
