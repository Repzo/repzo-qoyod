import Repzo from "repzo";
import DataSet from "data-set-query";
import {
  _fetch,
  update_bench_time,
  updateAt_query,
  set_error,
} from "../util.js";
export const sync_categories = async (commandEvent) => {
  var _a, _b, _c, _d, _e, _f, _g;
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
    console.log("sync_categories");
    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_category";
    await commandLog.load(commandEvent.sync_id);
    await commandLog
      .addDetail("Repzo Qoyod: Started Syncing Product Categories")
      .commit();
    const nameSpace = commandEvent.nameSpace.join("_");
    const result = {
      qoyod_total: 0,
      repzo_total: 0,
      created: 0,
      updated: 0,
      failed: 0,
    };
    const failed_docs_report = [];
    const qoyod_categories = await get_qoyod_categories(
      commandEvent.app.available_app.app_settings.serviceEndPoint,
      commandEvent.app.formData.serviceApiKey,
      updateAt_query("", commandEvent.app.options_formData, bench_time_key)
    );
    result.qoyod_total =
      (_b =
        qoyod_categories === null || qoyod_categories === void 0
          ? void 0
          : qoyod_categories.categories) === null || _b === void 0
        ? void 0
        : _b.length;
    await commandLog
      .addDetail(
        `${
          (_c =
            qoyod_categories === null || qoyod_categories === void 0
              ? void 0
              : qoyod_categories.categories) === null || _c === void 0
            ? void 0
            : _c.length
        } categories changed since ${
          commandEvent.app.options_formData[bench_time_key] || "ever"
        }`
      )
      .commit();
    const db = new DataSet([], { autoIndex: false });
    db.createIndex({
      id: true,
      name: true,
      // description: true,
    });
    db.load(
      qoyod_categories === null || qoyod_categories === void 0
        ? void 0
        : qoyod_categories.categories
    );
    const category_query =
      qoyod_categories === null || qoyod_categories === void 0
        ? void 0
        : qoyod_categories.categories.map(
            (category) => `${nameSpace}_${category.id}`
          );
    const repzo_categories = await repzo.category.find({
      "integration_meta.id": category_query,
      per_page: 50000,
    });
    result.repzo_total =
      (_d =
        repzo_categories === null || repzo_categories === void 0
          ? void 0
          : repzo_categories.data) === null || _d === void 0
        ? void 0
        : _d.length;
    await commandLog
      .addDetail(
        `${
          (_e =
            repzo_categories === null || repzo_categories === void 0
              ? void 0
              : repzo_categories.data) === null || _e === void 0
            ? void 0
            : _e.length
        } categories in Repzo was matched the integration.id`
      )
      .commit();
    for (let i = 0; i < qoyod_categories.categories.length; i++) {
      const qoyod_category = qoyod_categories.categories[i];
      const repzo_category = repzo_categories.data.find((r_category) => {
        var _a;
        return (
          ((_a = r_category.integration_meta) === null || _a === void 0
            ? void 0
            : _a.id) == `${nameSpace}_${qoyod_category.id}`
        );
      });
      const body = {
        _id:
          repzo_category === null || repzo_category === void 0
            ? void 0
            : repzo_category._id,
        name: qoyod_category.name,
        // description: qoyod_category.local_name
        disabled: false,
        integration_meta: {
          id: `${nameSpace}_${qoyod_category.id}`,
          qoyod_id: qoyod_category.id,
        },
      };
      if (!repzo_category) {
        // Create
        try {
          const created_category = await repzo.category.create(body);
          result.created++;
        } catch (e) {
          console.log(
            "Create Category Failed >> ",
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
            (_f = repzo_category.integration_meta) === null || _f === void 0
              ? void 0
              : _f.qoyod_id,
          name: repzo_category.name,
          // description: repzo_client.local_name,
        });
        if (found_identical_docs.length) continue;
        // Update
        try {
          const updated_category = await repzo.category.update(
            repzo_category._id,
            body
          );
          result.updated++;
        } catch (e) {
          console.log(
            "Update Category Failed >> ",
            e === null || e === void 0 ? void 0 : e.response,
            body
          );
          failed_docs_report.push({
            method: "update",
            doc_id:
              repzo_category === null || repzo_category === void 0
                ? void 0
                : repzo_category._id,
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
      ((_g = e === null || e === void 0 ? void 0 : e.response) === null ||
      _g === void 0
        ? void 0
        : _g.data) || e
    );
    await commandLog.setStatus("fail", e).commit();
    throw e;
  }
};
const get_qoyod_categories = async (serviceEndPoint, serviceApiKey, query) => {
  try {
    const qoyod_categories = await _fetch(
      serviceEndPoint,
      `/categories${query ? query : ""}`,
      { "API-KEY": serviceApiKey }
    );
    if (!qoyod_categories.hasOwnProperty("categories"))
      qoyod_categories.categories = [];
    return qoyod_categories;
  } catch (e) {
    if (e.response.status == 404) return { categories: [] };
    throw e;
  }
};
