import Repzo from "repzo";
import DataSet from "data-set-query";
import { update_bench_time, set_error } from "../util.js";
const qoyod_taxes = {
  taxes: [
    { id: 1, name: "15% VAT", percentage: 15, type: "additive" },
    { id: 1, name: "15% VAT", percentage: 15, type: "inclusive" },
    { id: 2, name: "Zero VAT", percentage: 0, type: "additive" },
    { id: 3, name: "VAT Exempt", percentage: 0, type: "additive" },
  ],
};
export const sync_taxes = async (commandEvent) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _j;
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
    console.log("sync_taxes");
    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_tax";
    await commandLog.load(commandEvent.sync_id);
    await commandLog.addDetail("Repzo Qoyod: Started Syncing Taxes").commit();
    const nameSpace = commandEvent.nameSpace.join("_");
    const result = {
      qoyod_total: 0,
      repzo_total: 0,
      created: 0,
      updated: 0,
      failed: 0,
    };
    const failed_docs_report = [];
    result.qoyod_total =
      (_b =
        qoyod_taxes === null || qoyod_taxes === void 0
          ? void 0
          : qoyod_taxes.taxes) === null || _b === void 0
        ? void 0
        : _b.length;
    const db = new DataSet([], { autoIndex: false });
    db.createIndex({
      id: true,
      name: true,
      percentage: true,
      type: true,
    });
    db.load(
      qoyod_taxes === null || qoyod_taxes === void 0
        ? void 0
        : qoyod_taxes.taxes
    );
    const tax_query =
      qoyod_taxes === null || qoyod_taxes === void 0
        ? void 0
        : qoyod_taxes.taxes.map((tax) => `${nameSpace}_${tax.id}_${tax.type}`);
    const repzo_taxes = await repzo.tax.find({
      "integration_meta.id": tax_query,
      per_page: 50000,
    });
    result.repzo_total =
      (_c =
        repzo_taxes === null || repzo_taxes === void 0
          ? void 0
          : repzo_taxes.data) === null || _c === void 0
        ? void 0
        : _c.length;
    await commandLog
      .addDetail(
        `${
          (_d =
            qoyod_taxes === null || qoyod_taxes === void 0
              ? void 0
              : qoyod_taxes.taxes) === null || _d === void 0
            ? void 0
            : _d.length
        } taxes changed since ${
          commandEvent.app.options_formData[bench_time_key] || "ever"
        }`
      )
      .addDetail(
        `${
          (_e =
            repzo_taxes === null || repzo_taxes === void 0
              ? void 0
              : repzo_taxes.data) === null || _e === void 0
            ? void 0
            : _e.length
        } taxes in Repzo was matched the integration.id`
      )
      .commit();
    for (let i = 0; i < qoyod_taxes.taxes.length; i++) {
      const qoyod_tax = qoyod_taxes.taxes[i];
      const repzo_tax = repzo_taxes.data.find((r_tax) => {
        var _a;
        return (
          ((_a = r_tax.integration_meta) === null || _a === void 0
            ? void 0
            : _a.id) == `${nameSpace}_${qoyod_tax.id}_${qoyod_tax.type}`
        );
      });
      const default_tax_type = "additive";
      const body = {
        _id:
          repzo_tax === null || repzo_tax === void 0 ? void 0 : repzo_tax._id,
        name: qoyod_tax.name,
        rate: qoyod_tax.percentage / 100,
        disabled: false,
        type: qoyod_tax.type || default_tax_type,
        integration_meta: {
          id: `${nameSpace}_${qoyod_tax.id}_${qoyod_tax.type}`,
          qoyod_id: qoyod_tax.id,
          percentage: qoyod_tax.percentage,
        },
      };
      if (!repzo_tax) {
        // Create
        try {
          const created_tax = await repzo.tax.create(body);
          result.created++;
        } catch (e) {
          console.log(
            "Create Tax Failed >> ",
            e === null || e === void 0 ? void 0 : e.response,
            body
          );
          failed_docs_report.push({
            method: "create",
            doc: body,
            error_message: set_error(e),
          });
          result.failed++;
        }
      } else {
        const found_identical_docs = db.search({
          id:
            (_f = repzo_tax.integration_meta) === null || _f === void 0
              ? void 0
              : _f.qoyod_id,
          name: repzo_tax.name,
          percentage:
            (_g = repzo_tax.integration_meta) === null || _g === void 0
              ? void 0
              : _g.percentage,
        });
        if (found_identical_docs.length) continue;
        // Update
        try {
          const updated_tax = await repzo.tax.update(repzo_tax._id, body);
          result.updated++;
        } catch (e) {
          console.log(
            "Update Tax Failed >> ",
            (_h = e === null || e === void 0 ? void 0 : e.response) === null ||
              _h === void 0
              ? void 0
              : _h.data,
            body
          );
          failed_docs_report.push({
            method: "update",
            doc_id:
              repzo_tax === null || repzo_tax === void 0
                ? void 0
                : repzo_tax._id,
            doc: body,
            error_message: set_error(e),
          });
          result.failed++;
        }
      }
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
      ((_j = e === null || e === void 0 ? void 0 : e.response) === null ||
      _j === void 0
        ? void 0
        : _j.data) || e
    );
    await commandLog.setStatus("fail", e).commit();
    throw e;
  }
};
