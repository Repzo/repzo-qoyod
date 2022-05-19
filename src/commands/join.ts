import Repzo from "repzo";
import { Service } from "repzo/lib/types";
import { EVENT, Config, CommandEvent } from "../types";
import { _fetch, _create, _update, _delete } from "../util.js";
import { actionsList } from "../actions/index.js";

export const join = async (commandEvent: CommandEvent) => {
  const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
    env: commandEvent.env,
  });

  const commandLog = new Repzo.CommandLog(
    repzo,
    commandEvent.app,
    commandEvent.command,
  );
  try {
    console.log("join");

    await commandLog.load(commandEvent.sync_id);
    await commandLog.addDetail("Repzo Qoyod: Join").commit();

    const body: Service.JoinActionsWeHook.Data = {
      data: [
        // invoice
        {
          app: "repzo-qoyod",
          action: "create_invoice",
          event: "invoice.create",
          join: commandEvent?.app?.formData?.invoices?.createInvoiceHook,
        },
        {
          app: "repzo-qoyod",
          action: "create_invoice",
          event: "invoiceItems.create",
          join: commandEvent?.app?.formData?.invoices?.createInvoiceHook,
        },
        {
          app: "repzo-qoyod",
          action: "create_invoice",
          event: "returnItems.create",
          join: commandEvent?.app?.formData?.invoices?.createInvoiceHook,
        },
        // payment
        {
          app: "repzo-qoyod",
          action: "create_payment",
          event: "payment.create",
          join: commandEvent?.app?.formData?.payment?.createPaymentHook,
        },
        // proforma
        {
          app: "repzo-qoyod",
          action: "create_proforma",
          event: "salesorder.approve",
          join: false,
        },
        {
          app: "repzo-qoyod",
          action: "create_proforma",
          event: "salesorder.create",
          join: false,
        },
        // transfer
        {
          app: "repzo-qoyod",
          action: "create_transfer",
          event: "transfer.approve",
          join: false,
        },
        {
          app: "repzo-qoyod",
          action: "create_transfer",
          event: "transfer.create",
          join: false,
        },
      ],
    };

    const result = await repzo.joinActionsWebHook.update(null, body);
    console.log(result);

    await commandLog.setStatus("success").setBody(result).commit();
  } catch (e: any) {
    //@ts-ignore
    console.error(e?.response?.data);
    await commandLog.setStatus("fail", e).commit();
    throw e?.response;
  }
};
