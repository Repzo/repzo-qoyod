import Repzo from "repzo";
import DataSet from "data-set-query";
import {
  _fetch,
  update_bench_time,
  updateAt_query,
  set_error,
} from "../util.js";
export const sync_measureunits = async (commandEvent) => {
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
    console.log("sync_measureunits");
    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_measureunit";
    await commandLog.load(commandEvent.sync_id);
    await commandLog
      .addDetail("Repzo Qoyod: Started Syncing Measure Unit")
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
    const qoyod_units = await get_qoyod_units(
      commandEvent.app.available_app.app_settings.serviceEndPoint,
      commandEvent.app.formData.serviceApiKey,
      updateAt_query("", commandEvent.app.options_formData, bench_time_key)
    );
    result.qoyod_total =
      (_b =
        qoyod_units === null || qoyod_units === void 0
          ? void 0
          : qoyod_units.product_unit_types) === null || _b === void 0
        ? void 0
        : _b.length;
    await commandLog
      .addDetail(
        `${
          (_c =
            qoyod_units === null || qoyod_units === void 0
              ? void 0
              : qoyod_units.product_unit_types) === null || _c === void 0
            ? void 0
            : _c.length
        } taxes changed since ${
          commandEvent.app.options_formData[bench_time_key] || "ever"
        }`
      )
      .commit();
    const db = new DataSet([], { autoIndex: false });
    db.createIndex({
      id: true,
      unit_name: true,
    });
    db.load(
      qoyod_units === null || qoyod_units === void 0
        ? void 0
        : qoyod_units.product_unit_types
    );
    const unit_query =
      qoyod_units === null || qoyod_units === void 0
        ? void 0
        : qoyod_units.product_unit_types.map(
            (unit) => `${nameSpace}_${unit.id}_1.0`
          ); // ??
    const repzo_base_unit = await repzo.measureunit.find({
      parent: "nil",
      factor: 1,
    });
    const repzo_base_unit_id =
      (repzo_base_unit === null || repzo_base_unit === void 0
        ? void 0
        : repzo_base_unit.data.length) == 1
        ? repzo_base_unit === null || repzo_base_unit === void 0
          ? void 0
          : repzo_base_unit.data[0]._id
        : undefined;
    if (!repzo_base_unit_id) {
      await commandLog
        .setStatus("fail", `Repzo Base Unit was not found`)
        .commit();
      throw new Error(`Repzo Base Unit was not found`);
    }
    const repzo_units = await repzo.measureunit.find({
      "integration_meta.id": unit_query,
      per_page: 50000,
    });
    result.repzo_total =
      (_d =
        repzo_units === null || repzo_units === void 0
          ? void 0
          : repzo_units.data) === null || _d === void 0
        ? void 0
        : _d.length;
    await commandLog
      .addDetail(
        `${
          (_e =
            repzo_units === null || repzo_units === void 0
              ? void 0
              : repzo_units.data) === null || _e === void 0
            ? void 0
            : _e.length
        } taxes in Repzo was matched the integration.id`
      )
      .commit();
    for (let i = 0; i < qoyod_units.product_unit_types.length; i++) {
      const qoyod_unit = qoyod_units.product_unit_types[i];
      const repzo_unit = repzo_units.data.find((r_unit) => {
        var _a;
        return (
          ((_a = r_unit.integration_meta) === null || _a === void 0
            ? void 0
            : _a.id) == `${nameSpace}_${qoyod_unit.id}_1.0`
        );
      });
      const body = {
        _id:
          repzo_unit === null || repzo_unit === void 0
            ? void 0
            : repzo_unit._id,
        name: qoyod_unit.unit_name,
        parent: repzo_base_unit_id,
        factor: 1,
        disabled: false,
        integration_meta: {
          id: `${nameSpace}_${qoyod_unit.id}_1.0`,
          qoyod_id: qoyod_unit.id,
          name: qoyod_unit.unit_name,
          factor: "1.0",
        },
      };
      if (!repzo_unit) {
        // Create
        try {
          const created_unit = await repzo.measureunit.create(body);
          result.created++;
        } catch (e) {
          // console.log("Create Measure Unit Failed >> ", e?.response, body);
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
            (_f = repzo_unit.integration_meta) === null || _f === void 0
              ? void 0
              : _f.qoyod_id,
          unit_name: repzo_unit.name,
          // unit_representation: repzo_client.local_name,
        });
        if (found_identical_docs.length) continue;
        // Update
        try {
          const updated_unit = await repzo.measureunit.update(
            repzo_unit._id,
            body
          );
          result.updated++;
        } catch (e) {
          // console.log("Update Measure Unit Failed >> ", e?.response, body);
          failed_docs_report.push({
            method: "update",
            doc_id:
              repzo_unit === null || repzo_unit === void 0
                ? void 0
                : repzo_unit._id,
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
export const get_qoyod_units = async (
  serviceEndPoint,
  serviceApiKey,
  query
) => {
  try {
    const qoyod_units = await _fetch(
      serviceEndPoint,
      `/product_unit_types${query ? query : ""}`,
      { "API-KEY": serviceApiKey }
    );
    if (!qoyod_units.hasOwnProperty("product_unit_types"))
      qoyod_units.product_unit_types = [];
    return qoyod_units;
  } catch (e) {
    if (e.response.status == 404) return { product_unit_types: [] };
    throw e;
  }
};
