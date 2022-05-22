import Repzo from "repzo";
import DataSet from "data-set-query";
import { EVENT, Config, CommandEvent, Result } from "../types";
import { _fetch, _create, _update, _delete } from "../util.js";
import { get_qoyod_products } from "./product.js";
import { get_qoyod_units, QoyodUnits } from "./measureunit.js";

interface QoyodProduct {
  id: number;
  name_ar: string;
  name_en: string;
  description?: string;
  category_id: number;
  type: "Product";
  unit_type: number;
  unit: string;
  tax_id: number;
  buying_price: string;
  selling_price: string;
  sku: string;
  barcode?: string;
  is_sold: boolean;
  is_bought: boolean;
  inventories?: {
    id: number;
    name_en: string;
    name_ar: string;
    stock: string;
  }[];
  ingredients?: [];
  unit_conversions?: {
    to_unit: number;
    from_unit: number;
    rate: string;
    barcode?: string;
    unit_purchase_price?: string;
    unit_selling_price?: string;
  }[];
}

interface QoyodProducts {
  products: QoyodProduct[];
}

type Unit = { id: number; factor: string; repzo_id?: any };
type QoyodFamily = {
  [key: string]: { name: string; measureunits: Unit[] };
};

export const sync_measureunit_family = async (commandEvent: CommandEvent) => {
  const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
    env: commandEvent.env,
  });
  const commandLog = new Repzo.CommandLog(
    repzo,
    commandEvent.app,
    commandEvent.command
  );
  try {
    console.log("sync_measureunit_family");
    await commandLog.load(commandEvent.sync_id);
    await commandLog
      .addDetail("Repzo Qoyod: Started Syncing Measure Unit Family")
      .commit();

    const nameSpace = commandEvent.nameSpace.join("_");
    const result: Result & {
      qoyod_total_families: number;
      created_families: number;
      created_secondary_units: number;
    } = {
      qoyod_total: 0,
      qoyod_total_families: 0,
      repzo_total: 0,
      created_families: 0,
      created_secondary_units: 0,
      created: 0,
      updated: 0,
      failed: 0,
      failed_msg: [],
    };
    const qoyod_products: QoyodProducts = await get_qoyod_products(
      commandEvent.app.available_app.app_settings.serviceEndPoint,
      commandEvent.app.formData.serviceApiKey
    );
    result.qoyod_total_families = qoyod_products?.products?.length;
    await commandLog
      .addDetail(`${qoyod_products?.products?.length} Products was found`)
      .commit();

    const qoyod_units: QoyodUnits = await get_qoyod_units(
      commandEvent.app.available_app.app_settings.serviceEndPoint,
      commandEvent.app.formData.serviceApiKey
    );

    await commandLog
      .addDetail(`${qoyod_units?.product_unit_types?.length} Units was found`)
      .commit();

    const qoyod_measureunit_families: QoyodFamily = {};
    const unique_measureunits: { [key: string]: Unit } = {};

    qoyod_products?.products.forEach((qoyod_product) => {
      const family_name: string = qoyod_product.sku;
      const family_measureunits: Unit[] = [];
      const family_base_unit: Unit = {
        id: qoyod_product.unit_type,
        factor: "1.0",
      };
      family_measureunits.push(family_base_unit);
      unique_measureunits[`${family_base_unit.id}_${family_base_unit.factor}`] =
        family_base_unit;

      qoyod_product.unit_conversions?.map((unit) => {
        const secondary_unit: Unit = {
          id: unit.from_unit,
          factor: unit.rate,
        };
        const key = `${secondary_unit.id}_${secondary_unit.factor}`;
        unique_measureunits[key] = secondary_unit;
        family_measureunits.push(secondary_unit);
      });

      qoyod_measureunit_families[family_name] = {
        name: family_name,
        measureunits: family_measureunits,
      };
    });

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

    const repzo_measureunits = await repzo.measureunit.find({
      per_page: 50000,
    });
    await commandLog
      .addDetail(`${repzo_measureunits?.data?.length} Measure Units was found`)
      .commit();

    for (let key in unique_measureunits) {
      const qoyod_measureunit = unique_measureunits[key];
      const repzo_measureunit = repzo_measureunits?.data?.find(
        (repzo_unit) =>
          repzo_unit.integration_meta?.id ==
          `${nameSpace}_${qoyod_measureunit.id}_${qoyod_measureunit.factor}`
      );

      if (!repzo_measureunit) {
        // Create measure unit
        const res: any = await create_measureunit({
          repzo,
          repzo_measureunits,
          qoyod_measureunit,
          nameSpace,
          qoyod_units,
          repzo_base_unit_id,
          result,
        });
        if (res) qoyod_measureunit.repzo_id = res;
        else console.log(`Measure Unit with _id: ${qoyod_measureunit.id}`);
      } else {
        qoyod_measureunit.repzo_id = repzo_measureunit._id;
      }
    }

    const repzo_measureunit_families = await repzo.measureunitFamily.find({
      per_page: 50000,
    });
    await commandLog
      .addDetail(
        `${repzo_measureunit_families?.data?.length} Measure Unit Family was found`
      )
      .commit();

    const db = new DataSet([], { autoIndex: false });
    db.createIndex({
      _id: true,
      name: true,
    });
    db.load(repzo_measureunit_families?.data);

    const measureunit_families: {
      name: string;
      measureunits: string[];
      disabled: boolean;
      integration_meta: { id: string; qoyod_id: string };
    }[] = Object.values(qoyod_measureunit_families).map((family) => {
      return {
        name: family.name,
        measureunits: family.measureunits
          .map(
            (unit) => unique_measureunits[`${unit.id}_${unit.factor}`]?.repzo_id
          )
          .filter((unit) => unit),
        disabled: false,
        integration_meta: {
          id: `${nameSpace}_${family.name}`,
          qoyod_id: family.name,
        },
      };
    });

    for (let i = 0; i < measureunit_families.length; i++) {
      const qoyod_family = measureunit_families[i];
      const repzo_family = repzo_measureunit_families.data.find(
        (r_family) =>
          r_family.integration_meta?.id == qoyod_family.integration_meta?.id
      );

      if (!repzo_family) {
        // Create
        try {
          const created_family = await repzo.measureunitFamily.create(
            qoyod_family
          );
          result.created_families++;
        } catch (e: any) {
          console.log(
            "Create Measure Unit Family Failed >> ",
            e.response,
            qoyod_family
          );
          result.failed_msg.push(
            "Create Measure Unit Family Failed >> ",
            e?.response,
            qoyod_family
          );
          result.failed++;
        }
      } else {
        const found_identical_docs = db.search({
          _id: repzo_family._id,
          name: qoyod_family.name,
        });

        const has_all_measureunits =
          found_identical_docs.length &&
          found_identical_docs[0].measureunits?.length ==
            qoyod_family.measureunits.length &&
          !found_identical_docs[0].measureunits.filter(
            (r_u: string) =>
              !qoyod_family.measureunits.find((q_u) => q_u == r_u)
          ).length;
        if (found_identical_docs.length && has_all_measureunits) continue;
        // Update
        try {
          const updated_family = await repzo.measureunitFamily.update(
            repzo_family._id,
            qoyod_family
          );
          result.updated++;
        } catch (e: any) {
          console.log("Update Measure Unit Failed >> ", e, qoyod_family);
          result.failed_msg.push(
            "Update Measure Unit Failed >> ",
            e?.response,
            qoyod_family
          );
          result.failed++;
        }
      }
    }

    console.log(result);
    await commandLog.setStatus("success").setBody(result).commit();
    return result;
  } catch (e: any) {
    //@ts-ignore
    console.error(e?.response?.data);
    await commandLog.setStatus("fail", e).commit();
    throw e?.response;
  }
};

const create_measureunit = async ({
  repzo,
  qoyod_measureunit,
  repzo_measureunits,
  nameSpace,
  qoyod_units,
  repzo_base_unit_id,
  result,
}: {
  repzo: Repzo;
  qoyod_measureunit: Unit;
  repzo_measureunits: any;
  nameSpace: string;
  qoyod_units: QoyodUnits;
  repzo_base_unit_id: any;
  result: any;
}): Promise<string | void> => {
  try {
    const matched_base_unit = qoyod_units?.product_unit_types?.find(
      (base_unit) => base_unit.id == qoyod_measureunit.id
    );

    if (!matched_base_unit) {
      result.failed++;
      throw new Error(
        `Create Secondary Measure unit Failed >> MeasureUnit with integration_meta.id: ${nameSpace}_${qoyod_measureunit.id} was not found`
      );
    }
    const body = {
      name: matched_base_unit.unit_name,
      parent: repzo_base_unit_id,
      factor: Number(qoyod_measureunit.factor) || 1,
      disabled: false,
      integration_meta: {
        id: `${nameSpace}_${qoyod_measureunit.id}_${qoyod_measureunit.factor}`,
        qoyod_id: qoyod_measureunit.id,
        name: matched_base_unit.unit_name,
        factor: qoyod_measureunit.factor,
      },
    };

    try {
      const created_unit = await repzo.measureunit.create(body);
      result.created_secondary_units++;
      repzo_measureunits?.data?.push(created_unit);
      return created_unit._id;
    } catch (e: any) {
      console.log("Create Measure Unit Failed >> ", e?.response, body);
      result.failed++;
    }
  } catch (e) {
    throw e;
  }
};
