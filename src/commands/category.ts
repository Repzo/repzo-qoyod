import Repzo from "repzo";
import DataSet from "data-set-query";
import { EVENT, Config, CommandEvent, Result } from "../types";
import {
  _fetch,
  _create,
  _update,
  _delete,
  update_bench_time,
  updateAt_query,
} from "../util.js";

interface QoyodCategory {
  id: number;
  name: string;
  description: string;
  parent_id?: number;
}

interface QoyodCategories {
  categories: QoyodCategory[];
}

export const sync_categories = async (commandEvent: CommandEvent) => {
  const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
    env: commandEvent.env,
  });

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
    const result: Result = {
      qoyod_total: 0,
      repzo_total: 0,
      created: 0,
      updated: 0,
      failed: 0,
      failed_msg: [],
    };

    const qoyod_categories: QoyodCategories = await get_qoyod_categories(
      commandEvent.app.available_app.app_settings.serviceEndPoint,
      commandEvent.app.formData.serviceApiKey,
      updateAt_query("", commandEvent.app.options_formData, bench_time_key)
    );

    result.qoyod_total = qoyod_categories?.categories?.length;
    await commandLog
      .addDetail(
        `${qoyod_categories?.categories?.length} categories changed since ${
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
    db.load(qoyod_categories?.categories);

    const category_query = qoyod_categories?.categories.map(
      (category: QoyodCategory) => `${nameSpace}_${category.id}`
    );

    const repzo_categories = await repzo.category.find({
      "integration_meta.id": category_query,
    });

    result.repzo_total = repzo_categories?.data?.length;
    await commandLog
      .addDetail(
        `${repzo_categories?.data?.length} categories in Repzo was matched the integration.id`
      )
      .commit();

    for (let i = 0; i < qoyod_categories.categories.length; i++) {
      const qoyod_category: QoyodCategory = qoyod_categories.categories[i];
      const repzo_category = repzo_categories.data.find(
        (r_category) =>
          r_category.integration_meta?.id == `${nameSpace}_${qoyod_category.id}`
      );

      const body = {
        _id: repzo_category?._id,
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
        } catch (e: any) {
          result.failed_msg.push(
            "Create Category Failed >> ",
            e?.response,
            body
          );
          console.log("Create Category Failed >> ", e?.response, body);
          result.failed++;
        }
      } else {
        const found_identical_docs = db.search({
          id: repzo_category.integration_meta?.qoyod_id,
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
        } catch (e: any) {
          result.failed_msg.push(
            "Update Category Failed >> ",
            e?.response,
            body
          );
          console.log("Update Category Failed >> ", e?.response, body);
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
    await commandLog.setStatus("success").setBody(result).commit();

    return result;
  } catch (e: any) {
    //@ts-ignore
    console.error(e?.response?.data);
    await commandLog.setStatus("fail", e).commit();
    throw e?.response;
  }
};

const get_qoyod_categories = async (
  serviceEndPoint: string,
  serviceApiKey: string,
  query?: string
): Promise<QoyodCategories> => {
  try {
    const qoyod_categories: QoyodCategories = await _fetch(
      serviceEndPoint,
      `/categories${query ? query : ""}`,
      { "API-KEY": serviceApiKey }
    );
    if (!qoyod_categories.hasOwnProperty("categories"))
      qoyod_categories.categories = [];
    return qoyod_categories;
  } catch (e: any) {
    if (e.response.status == 404) return { categories: [] };
    throw e;
  }
};
