import Repzo from "repzo";
import { update_bench_time, set_error } from "../util.js";
export const sync_username_account_id = async (commandEvent) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
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
    // console.log("sync_user_account_id");
    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_username_account_id";
    await commandLog.load(commandEvent.sync_id);
    await commandLog
      .addDetail("Repzo: Started Syncing Username Account _id")
      .commit();
    const nameSpace = commandEvent.nameSpace.join("_");
    const result = {
      total_reps_with_accounts_ids: 0,
      repzo_reps: 0,
      unset: 0,
      created: 0,
      updated: 0,
      failed: 0,
    };
    const failed_docs_report = [];
    const username_accounts =
      ((_c =
        (_b =
          commandEvent === null || commandEvent === void 0
            ? void 0
            : commandEvent.app) === null || _b === void 0
          ? void 0
          : _b.formData) === null || _c === void 0
        ? void 0
        : _c.username_payment_account_id) || [];
    result.total_reps_with_accounts_ids =
      username_accounts === null || username_accounts === void 0
        ? void 0
        : username_accounts.length;
    await commandLog
      .addDetail(
        `${result.total_reps_with_accounts_ids} username account_i was found in settings`
      )
      .commit();
    const usernames = username_accounts.map((a) => a.username);
    // console.log(usernames);
    const reps = await repzo.rep.find({ username: usernames, per_page: 50000 });
    result.repzo_reps =
      (_d = reps === null || reps === void 0 ? void 0 : reps.data) === null ||
      _d === void 0
        ? void 0
        : _d.length;
    await commandLog
      .addDetail(`${result.repzo_reps} username was found in repzo`)
      .commit();
    for (let i = 0; i < username_accounts.length; i++) {
      const username_account = username_accounts[i];
      const username = username_account.username;
      const rep =
        (_e = reps === null || reps === void 0 ? void 0 : reps.data) === null ||
        _e === void 0
          ? void 0
          : _e.find((rep) => rep.username === username);
      const update = {
        company_namespace:
          rep === null || rep === void 0 ? void 0 : rep.company_namespace,
      };
      try {
        if (!rep) {
          //   console.log(`Username Failed >> ${username}`);
          throw new Error(`Username: ${username} was not found in Repzo`);
        }
        if (
          username_account.hasOwnProperty("payment_account_id") &&
          username_account.payment_account_id != null
        ) {
          if (
            username_account.payment_account_id !=
            ((_f = rep.integration_meta) === null || _f === void 0
              ? void 0
              : _f.qoyod_payment_account_id)
          ) {
            update["integration_meta.qoyod_payment_account_id"] =
              username_account.payment_account_id;
          }
        } else {
          if (
            ((_g = rep.integration_meta) === null || _g === void 0
              ? void 0
              : _g.hasOwnProperty("qoyod_payment_account_id")) &&
            rep.integration_meta.qoyod_payment_account_id != null
          ) {
            update["integration_meta.qoyod_payment_account_id"] = null;
          }
        }
        if (
          username_account.hasOwnProperty("refund_account_id") &&
          username_account.refund_account_id != null
        ) {
          if (
            username_account.refund_account_id !=
            ((_h = rep.integration_meta) === null || _h === void 0
              ? void 0
              : _h.qoyod_refund_account_id)
          ) {
            update["integration_meta.qoyod_refund_account_id"] =
              username_account.refund_account_id;
          }
        } else {
          if (
            ((_j = rep.integration_meta) === null || _j === void 0
              ? void 0
              : _j.hasOwnProperty("qoyod_refund_account_id")) &&
            rep.integration_meta.qoyod_refund_account_id != null
          ) {
            update["integration_meta.qoyod_refund_account_id"] = null;
          }
        }
        if (Object.keys(update).length > 1) {
          //   console.log({ username, _id: rep._id, update });
          const updated_rep = await repzo.rep.update(rep._id, update);
          result.updated++;
        }
      } catch (e) {
        failed_docs_report.push({
          method: "update",
          doc_id: rep === null || rep === void 0 ? void 0 : rep._id,
          doc: update,
          error_message: set_error(e),
        });
        result.failed++;
      }
    }
    try {
      const repzo_bulkUpdate_rep = await repzo.patchAction.update({
        slug: "rep",
        readQuery: [
          {
            key: "username",
            operator: "nin",
            value: usernames,
          },
        ],
        writeQuery: [
          {
            key: "integration_meta.qoyod_payment_account_id",
            command: "set",
            value: null,
          },
          {
            key: "integration_meta.qoyod_refund_account_id",
            command: "set",
            value: null,
          },
        ],
      });
      result.unset =
        repzo_bulkUpdate_rep === null || repzo_bulkUpdate_rep === void 0
          ? void 0
          : repzo_bulkUpdate_rep.nModified;
    } catch (e) {
      failed_docs_report.push({
        method: "update",
        doc_id: "",
        doc: {
          readQuery: [{ key: "username", operator: "nin", value: usernames }],
          writeQuery: [
            {
              key: "integration_meta.qoyod_payment_account_id",
              command: "set",
              value: null,
            },
            {
              key: "integration_meta.qoyod_refund_account_id",
              command: "set",
              value: null,
            },
          ],
        },
        error_message: set_error(e),
      });
      result.failed++;
    }
    // console.log(result);
    await update_bench_time(
      repzo,
      commandEvent.app._id,
      bench_time_key,
      new_bench_time
    );
    await commandLog
      .setStatus(
        "success",
        failed_docs_report.length ? failed_docs_report : null
      )
      .setBody(result)
      .commit();
    return result;
  } catch (e) {
    //@ts-ignore
    console.error(
      ((_k = e === null || e === void 0 ? void 0 : e.response) === null ||
      _k === void 0
        ? void 0
        : _k.data) || e
    );
    await commandLog.setStatus("fail", e).commit();
    throw e;
  }
};
