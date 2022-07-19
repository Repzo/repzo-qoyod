import Repzo from "repzo";
import { EVENT, Config } from "../types";
import { _fetch, _create, _update, _delete } from "../util.js";
import { Service } from "repzo/src/types";
import { v4 as uuid } from "uuid";

interface QoyodReceipt {
  receipt: {
    contact_id: string;
    reference: string;
    kind: "paid";
    account_id: number;
    amount: number;
    description?: string;
    date: string;
  };
}

export const create_refund = async (event: EVENT, options: Config) => {
  const repzo = new Repzo(options.data?.repzoApiKey, { env: options.env });
  const action_sync_id: string = event?.headers?.action_sync_id || uuid();
  const actionLog = new Repzo.ActionLogs(repzo, action_sync_id);
  let body: Service.Refund.RefundSchema | any;
  try {
    await actionLog.load(action_sync_id);
    body = event.body;
    try {
      if (body) body = JSON.parse(body);
    } catch (e) {}

    await actionLog
      .addDetail(
        `Repzo Qoyod: Started Create Refund - ${body?.serial_number?.formatted}`
      )
      .commit();

    const repzo_refund = body;
    const rep_id =
      repzo_refund.creator?.type === "rep" ? repzo_refund.creator?._id : null;
    let rep, qoyod_refund_account_id;
    if (repzo_refund.creator?.type === "rep" && rep_id) {
      rep = await repzo.rep.get(rep_id);
      qoyod_refund_account_id = rep.integration_meta?.qoyod_refund_account_id;
    }

    const qoyod_client = await repzo.client.get(repzo_refund.client_id);
    if (!qoyod_client.integration_meta?.qoyod_id)
      throw new Error(
        `Create Refund Failed >> refund.client: ${repzo_refund.client_id} - ${repzo_refund.client_name} was missed the integration.qoyod_id`
      );

    const qoyod_refund_body: QoyodReceipt = {
      receipt: {
        contact_id: qoyod_client.integration_meta?.qoyod_id,
        reference: repzo_refund.serial_number.formatted,
        kind: "paid",
        account_id: qoyod_refund_account_id
          ? qoyod_refund_account_id
          : options.data.paymentAccountId,
        amount: repzo_refund.amount / 1000,
        // description: "Testing api",
        date: repzo_refund.paytime,
      },
    };

    await actionLog
      .addDetail(
        `Repzo Qoyod: Trying to post refund to qoyod`,
        qoyod_refund_body
      )
      .commit();

    // console.dir(qoyod_refund_body, { depth: null });
    // actionLog.setMeta(qoyod_refund_body);
    await actionLog
      .addDetail(
        `Repzo Qoyod: Refund - ${qoyod_refund_body?.receipt?.reference}`,
        qoyod_refund_body
      )
      .commit();

    const result = await _create(
      options.serviceEndPoint,
      "/receipts",
      qoyod_refund_body,
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
