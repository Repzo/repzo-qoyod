import Repzo from "repzo";
import {
  EVENT,
  Config,
  CommandEvent,
  Result,
  FailedDocsReport,
} from "../types";
import {
  _fetch,
  _create,
  _update,
  _delete,
  update_bench_time,
  set_error,
} from "../util.js";

interface UsernameAccountId {
  username: string;
  payment_account_id: number;
  refund_account_id?: number;
}

export const sync_username_account_id = async (commandEvent: CommandEvent) => {
  const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
    env: commandEvent.env,
  });

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
    const failed_docs_report: FailedDocsReport = [];

    const username_accounts: UsernameAccountId[] =
      commandEvent?.app?.formData?.username_payment_account_id || [];

    result.total_reps_with_accounts_ids = username_accounts?.length;

    await commandLog
      .addDetail(
        `${result.total_reps_with_accounts_ids} username account_i was found in settings`
      )
      .commit();

    const usernames: string[] = username_accounts.map((a) => a.username);

    // console.log(usernames);

    const reps = await repzo.rep.find({ username: usernames, per_page: 50000 });
    result.repzo_reps = reps?.data?.length;
    await commandLog
      .addDetail(`${result.repzo_reps} username was found in repzo`)
      .commit();

    for (let i = 0; i < username_accounts.length; i++) {
      const username_account = username_accounts[i];
      const username = username_account.username;
      const rep = reps?.data?.find((rep) => rep.username === username);
      const update: {
        company_namespace: any;
        [key: string]: any;
      } = {
        company_namespace: rep?.company_namespace,
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
            rep.integration_meta?.qoyod_payment_account_id
          ) {
            update["integration_meta.qoyod_payment_account_id"] =
              username_account.payment_account_id;
          }
        } else {
          if (
            rep.integration_meta?.hasOwnProperty("qoyod_payment_account_id") &&
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
            rep.integration_meta?.qoyod_refund_account_id
          ) {
            update["integration_meta.qoyod_refund_account_id"] =
              username_account.refund_account_id as number;
          }
        } else {
          if (
            rep.integration_meta?.hasOwnProperty("qoyod_refund_account_id") &&
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
          doc_id: rep?._id,
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
      result.unset = repzo_bulkUpdate_rep?.nModified;
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
  } catch (e: any) {
    //@ts-ignore
    console.error(e?.response?.data || e);
    await commandLog.setStatus("fail", e).commit();
    throw e;
  }
};
