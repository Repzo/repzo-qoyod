import Repzo from "repzo";
export const join = async (commandEvent) => {
  var _a,
    _b,
    _c,
    _d,
    _e,
    _f,
    _g,
    _h,
    _j,
    _k,
    _l,
    _m,
    _o,
    _p,
    _q,
    _r,
    _s,
    _t,
    _u,
    _v;
  const repzo = new Repzo(
    (_a = commandEvent.app.formData) === null || _a === void 0
      ? void 0
      : _a.repzoApiKey,
    {
      env: commandEvent.env,
    }
  );
  const commandLog = new Repzo.CommandLog(
    repzo,
    commandEvent.app,
    commandEvent.command
  );
  try {
    console.log("join");
    await commandLog.load(commandEvent.sync_id);
    await commandLog.addDetail("Repzo Qoyod: Join").commit();
    const body = {
      data: [
        // invoice
        // {
        //   app: "repzo-qoyod",
        //   action: "create_invoice",
        //   event: "invoice.create",
        //   join:
        //     commandEvent?.app?.formData?.invoices?.createInvoiceHook || false,
        // },
        {
          app: "repzo-qoyod",
          action: "create_invoice",
          event: "invoiceItems.create",
          join:
            ((_d =
              (_c =
                (_b =
                  commandEvent === null || commandEvent === void 0
                    ? void 0
                    : commandEvent.app) === null || _b === void 0
                  ? void 0
                  : _b.formData) === null || _c === void 0
                ? void 0
                : _c.invoices) === null || _d === void 0
              ? void 0
              : _d.createInvoiceHook) || false,
        },
        {
          app: "repzo-qoyod",
          action: "create_creditNote",
          event: "returnItems.create",
          join:
            ((_g =
              (_f =
                (_e =
                  commandEvent === null || commandEvent === void 0
                    ? void 0
                    : commandEvent.app) === null || _e === void 0
                  ? void 0
                  : _e.formData) === null || _f === void 0
                ? void 0
                : _f.invoices) === null || _g === void 0
              ? void 0
              : _g.createCreditNoteHook) || false,
        },
        // payment
        {
          app: "repzo-qoyod",
          action: "create_payment",
          event: "payment.create",
          join:
            ((_k =
              (_j =
                (_h =
                  commandEvent === null || commandEvent === void 0
                    ? void 0
                    : commandEvent.app) === null || _h === void 0
                  ? void 0
                  : _h.formData) === null || _j === void 0
                ? void 0
                : _j.payments) === null || _k === void 0
              ? void 0
              : _k.createPaymentHook) || false,
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
        {
          app: "repzo-qoyod",
          action: "create_transfer",
          event: "transfer.create",
          join:
            ((_o =
              (_m =
                (_l =
                  commandEvent === null || commandEvent === void 0
                    ? void 0
                    : commandEvent.app) === null || _l === void 0
                  ? void 0
                  : _l.formData) === null || _m === void 0
                ? void 0
                : _m.transfer) === null || _o === void 0
              ? void 0
              : _o.createTransferHook) || false,
        },
        // refund
        {
          app: "repzo-qoyod",
          action: "create_refund",
          event: "refund.create",
          join:
            ((_r =
              (_q =
                (_p =
                  commandEvent === null || commandEvent === void 0
                    ? void 0
                    : commandEvent.app) === null || _p === void 0
                  ? void 0
                  : _p.formData) === null || _q === void 0
                ? void 0
                : _q.refunds) === null || _r === void 0
              ? void 0
              : _r.createRefundHook) || false,
        },
        // client
        {
          app: "repzo-qoyod",
          action: "create_client",
          event: "client.create",
          join:
            ((_u =
              (_t =
                (_s =
                  commandEvent === null || commandEvent === void 0
                    ? void 0
                    : commandEvent.app) === null || _s === void 0
                  ? void 0
                  : _s.formData) === null || _t === void 0
                ? void 0
                : _t.client) === null || _u === void 0
              ? void 0
              : _u.clientHook) || false,
        },
      ],
    };
    const result = await repzo.joinActionsWebHook.update(null, body);
    // console.log(result);
    await commandLog.setStatus("success").setBody(result).commit();
  } catch (e) {
    //@ts-ignore
    console.error(
      ((_v = e === null || e === void 0 ? void 0 : e.response) === null ||
      _v === void 0
        ? void 0
        : _v.data) || e
    );
    await commandLog.setStatus("fail", e).commit();
    throw e;
  }
};
