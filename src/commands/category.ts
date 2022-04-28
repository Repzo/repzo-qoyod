import Repzo from "repzo";
import DataSet from "data-set-query";
import { EVENT, Config, CommandEvent } from "../types";
import { _fetch, _create, _update, _delete } from "../util.js";

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
  try {
    console.log("sync_categories");
    const nameSpace = commandEvent.nameSpace.join("_");
    const result = {
      qoyod_total: 0,
      repzo_total: 0,
      created: 0,
      updated: 0,
      failed: 0,
    };
    const qoyod_categories: QoyodCategories = await get_qoyod_categories(
      commandEvent.app.available_app.app_settings.serviceEndPoint,
      commandEvent.app.formData.serviceApiKey,
    );
    result.qoyod_total = qoyod_categories?.categories?.length;
    const db = new DataSet([], { autoIndex: false });
    db.createIndex({
      id: true,
      name: true,
      // description: true,
    });
    db.load(qoyod_categories?.categories);

    const category_query = qoyod_categories?.categories.map(
      (category: QoyodCategory) => `${nameSpace}_${category.id}`,
    );

    const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
      env: commandEvent.env,
    });
    const repzo_categories = await repzo.category.find({
      "integration_meta.id": category_query,
    });
    result.repzo_total = repzo_categories?.data?.length;
    for (let i = 0; i < qoyod_categories.categories.length; i++) {
      const qoyod_category: QoyodCategory = qoyod_categories.categories[i];
      const repzo_category = repzo_categories.data.find(
        (r_category) =>
          r_category.integration_meta?.id ==
          `${nameSpace}_${qoyod_category.id}`,
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
          console.log("Create Category Failed >> ", e.response, body);
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
            body,
          );
          result.updated++;
        } catch (e) {
          console.log("Update Category Failed >> ", e, body);
          result.failed++;
        }
      }
    }

    console.log(result);
    return result;
  } catch (e: any) {
    //@ts-ignore
    console.error(e.response.data);
    throw e?.response;
  }
};

const get_qoyod_categories = async (
  serviceEndPoint: string,
  serviceApiKey: string,
  query?: string,
): Promise<QoyodCategories> => {
  try {
    const qoyod_categories: QoyodCategories = await _fetch(
      serviceEndPoint,
      `/categories${query ? query : ""}`,
      { "API-KEY": serviceApiKey },
    );
    return qoyod_categories;
  } catch (e: any) {
    // code instead of msg
    if (
      e.response.data ==
      "We could not retrieve your categories, we found nothing."
    )
      return { categories: [] };

    throw e;
  }
};
