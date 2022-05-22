import Repzo from "repzo";
export const join = async (commandEvent) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const repzo = new Repzo((_a = commandEvent.app.formData) === null || _a === void 0 ? void 0 : _a.repzoApiKey, {
        env: commandEvent.env,
    });
    const commandLog = new Repzo.CommandLog(repzo, commandEvent.app, commandEvent.command);
    try {
        console.log("join");
        await commandLog.load(commandEvent.sync_id);
        await commandLog.addDetail("Repzo Qoyod: Join").commit();
        const body = {
            data: [
                // invoice
                {
                    app: "repzo-qoyod",
                    action: "create_invoice",
                    event: "invoice.create",
                    join: (_d = (_c = (_b = commandEvent === null || commandEvent === void 0 ? void 0 : commandEvent.app) === null || _b === void 0 ? void 0 : _b.formData) === null || _c === void 0 ? void 0 : _c.invoices) === null || _d === void 0 ? void 0 : _d.createInvoiceHook,
                },
                // {
                //   app: "repzo-qoyod",
                //   action: "create_invoice",
                //   event: "invoiceItems.create",
                //   join: false,
                // },
                // {
                //   app: "repzo-qoyod",
                //   action: "create_invoice",
                //   event: "returnItems.create",
                //   join: false,
                // },
                // payment
                {
                    app: "repzo-qoyod",
                    action: "create_payment",
                    event: "payment.create",
                    join: (_g = (_f = (_e = commandEvent === null || commandEvent === void 0 ? void 0 : commandEvent.app) === null || _e === void 0 ? void 0 : _e.formData) === null || _f === void 0 ? void 0 : _f.payment) === null || _g === void 0 ? void 0 : _g.createPaymentHook,
                },
                // proforma
                // {
                //   app: "repzo-qoyod",
                //   action: "create_proforma",
                //   event: "salesorder.approve",
                //   join: false,
                // },
                // {
                //   app: "repzo-qoyod",
                //   action: "create_proforma",
                //   event: "salesorder.create",
                //   join: false,
                // },
                // transfer
                // {
                //   app: "repzo-qoyod",
                //   action: "create_transfer",
                //   event: "transfer.approve",
                //   join: false,
                // },
                // {
                //   app: "repzo-qoyod",
                //   action: "create_transfer",
                //   event: "transfer.create",
                //   join: false,
                // },
            ],
        };
        const result = await repzo.joinActionsWebHook.update(null, body);
        console.log(result);
        await commandLog.setStatus("success").setBody(result).commit();
    }
    catch (e) {
        //@ts-ignore
        console.error((_h = e === null || e === void 0 ? void 0 : e.response) === null || _h === void 0 ? void 0 : _h.data);
        await commandLog.setStatus("fail", e).commit();
        throw e === null || e === void 0 ? void 0 : e.response;
    }
};
