import Repzo from "repzo";
import DataSet from "data-set-query";
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
  updateAt_query,
  set_error,
  get_data_from_qoyod,
} from "../util.js";

interface QoyodUnit {
  id: number;
  unit_name: string;
  unit_representation: string;
}

export interface QoyodUnits {
  product_unit_types: QoyodUnit[];
}

export const sync_measureunits = async (commandEvent: CommandEvent) => {
  const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
    env: commandEvent.env,
  });
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
    const result: Result = {
      qoyod_total: 0,
      repzo_total: 0,
      created: 0,
      updated: 0,
      failed: 0,
    };
    const failed_docs_report: FailedDocsReport = [];

    const qoyod_units: QoyodUnits = await get_qoyod_units(
      commandEvent.app.available_app.app_settings.serviceEndPoint,
      commandEvent.app.formData.serviceApiKey,
      updateAt_query("", commandEvent.app.options_formData, bench_time_key)
    );
    result.qoyod_total = qoyod_units?.product_unit_types?.length;
    await commandLog
      .addDetail(
        `${qoyod_units?.product_unit_types?.length} taxes changed since ${
          commandEvent.app.options_formData[bench_time_key] || "ever"
        }`
      )
      .commit();

    const db = new DataSet([], { autoIndex: false });
    db.createIndex({
      id: true,
      unit_name: true,
    });
    db.load(qoyod_units?.product_unit_types);

    const unit_query = qoyod_units?.product_unit_types.map(
      (unit: QoyodUnit) => `${nameSpace}_${unit.id}_1.0`
    ); // ??

    const repzo_base_unit = await repzo.measureunit.find({
      parent: "nil",
      factor: 1,
    });
    const repzo_base_unit_id =
      repzo_base_unit?.data.length == 1
        ? repzo_base_unit?.data[0]._id
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
    result.repzo_total = repzo_units?.data?.length;
    await commandLog
      .addDetail(
        `${repzo_units?.data?.length} taxes in Repzo was matched the integration.id`
      )
      .commit();

    for (let i = 0; i < qoyod_units.product_unit_types.length; i++) {
      const qoyod_unit: QoyodUnit = qoyod_units.product_unit_types[i];
      const repzo_unit = repzo_units.data.find(
        (r_unit) =>
          r_unit.integration_meta?.id == `${nameSpace}_${qoyod_unit.id}_1.0`
      );

      const body = {
        _id: repzo_unit?._id,
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
        } catch (e: any) {
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
          id: repzo_unit.integration_meta?.qoyod_id,
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
        } catch (e: any) {
          // console.log("Update Measure Unit Failed >> ", e?.response, body);
          failed_docs_report.push({
            method: "update",
            doc_id: repzo_unit?._id,
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
  } catch (e: any) {
    //@ts-ignore
    console.error(e?.response?.data || e);
    await commandLog.setStatus("fail", e).commit();
    throw e;
  }
};

export const get_qoyod_units = async (
  serviceEndPoint: string,
  serviceApiKey: string,
  query?: string
): Promise<QoyodUnits> => {
  try {
    const result: QoyodUnits["product_unit_types"] = await get_data_from_qoyod({
      _path: "product_unit_types",
      default_res: [],
      serviceEndPoint,
      serviceApiKey,
      entityName: "product_unit_types",
      query,
    });

    return { product_unit_types: result };

    // const qoyod_units: QoyodUnits = await _fetch(
    //   serviceEndPoint,
    //   `/product_unit_types${query ? query : ""}`,
    //   { "API-KEY": serviceApiKey }
    // );
    // if (!qoyod_units.hasOwnProperty("product_unit_types"))
    //   qoyod_units.product_unit_types = [];
    // return qoyod_units;
  } catch (e: any) {
    if (e.response?.status == 404) return { product_unit_types: [] };
    throw e;
  }
};
