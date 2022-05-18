import Repzo from "repzo";
import DataSet from "data-set-query";
import { EVENT, Config, CommandEvent } from "../types";
import {
  _fetch,
  _create,
  _update,
  _delete,
  update_bench_time,
  updateAt_query,
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
  try {
    console.log("sync_measureunits");

    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_measureunit";

    const nameSpace = commandEvent.nameSpace.join("_");
    const result = {
      qoyod_total: 0,
      repzo_total: 0,
      created: 0,
      updated: 0,
      failed: 0,
    };

    const qoyod_units: QoyodUnits = await get_qoyod_units(
      commandEvent.app.available_app.app_settings.serviceEndPoint,
      commandEvent.app.formData.serviceApiKey,
      updateAt_query("", commandEvent.app.options_formData, bench_time_key),
    );
    result.qoyod_total = qoyod_units?.product_unit_types?.length;

    const db = new DataSet([], { autoIndex: false });
    db.createIndex({
      id: true,
      unit_name: true,
    });
    db.load(qoyod_units?.product_unit_types);

    const unit_query = qoyod_units?.product_unit_types.map(
      (unit: QoyodUnit) => `${nameSpace}_${unit.id}_1.0`,
    ); // ??

    const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
      env: commandEvent.env,
    });

    const repzo_base_unit = await repzo.measureunit.find({
      parent: "nil",
      factor: 1,
    });
    const repzo_base_unit_id =
      repzo_base_unit?.data.length == 1
        ? repzo_base_unit?.data[0]._id
        : undefined;
    if (!repzo_base_unit_id) throw new Error(`Repzo Base Unit was not found`);

    const repzo_units = await repzo.measureunit.find({
      "integration_meta.id": unit_query,
      // project:["_id", "name", "integration_meta", "disabled", "email", "phone", "tax_number"]
    });
    result.repzo_total = repzo_units?.data?.length;
    for (let i = 0; i < qoyod_units.product_unit_types.length; i++) {
      const qoyod_unit: QoyodUnit = qoyod_units.product_unit_types[i];
      const repzo_unit = repzo_units.data.find(
        (r_unit) =>
          r_unit.integration_meta?.id == `${nameSpace}_${qoyod_unit.id}_1.0`,
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
          console.log("Create Measure Unit Failed >> ", e.response, body);
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
            body,
          );
          result.updated++;
        } catch (e) {
          console.log("Update Measure Unit Failed >> ", e, body);
          result.failed++;
        }
      }
    }

    console.log(result);

    await update_bench_time(
      repzo,
      commandEvent.app._id,
      bench_time_key,
      new_bench_time,
    );

    return result;
  } catch (e: any) {
    //@ts-ignore
    console.error(e.response.data);
    throw e?.response;
  }
};

export const get_qoyod_units = async (
  serviceEndPoint: string,
  serviceApiKey: string,
  query?: string,
): Promise<QoyodUnits> => {
  try {
    const qoyod_units: QoyodUnits = await _fetch(
      serviceEndPoint,
      `/product_unit_types${query ? query : ""}`,
      { "API-KEY": serviceApiKey },
    );
    return qoyod_units;
  } catch (e: any) {
    // code instead of msg
    if (
      e.response.data ==
      "We could not retrieve your product_unit_types, we found nothing."
    )
      return { product_unit_types: [] };

    throw e;
  }
};
