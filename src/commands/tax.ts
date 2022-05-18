import Repzo from "repzo";
import DataSet from "data-set-query";
import { EVENT, Config, CommandEvent } from "../types";
import {
  _fetch,
  _create,
  _update,
  _delete,
  update_bench_time,
} from "../util.js";

interface QoyodTax {
  id: number;
  name: string;
  percentage: number;
  type: "inclusive" | "additive" | "N/A";
}

interface QoyodTaxes {
  taxes: QoyodTax[];
}

const qoyod_taxes: QoyodTaxes = {
  taxes: [
    { id: 1, name: "15% VAT", percentage: 15, type: "additive" },
    { id: 1, name: "15% VAT", percentage: 15, type: "inclusive" },
    { id: 2, name: "Zero VAT", percentage: 0, type: "additive" },
    { id: 3, name: "VAT Exempt", percentage: 0, type: "additive" },
  ],
};

export const sync_taxes = async (commandEvent: CommandEvent) => {
  try {
    console.log("sync_taxes");

    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_tax";

    const nameSpace = commandEvent.nameSpace.join("_");
    const result = {
      qoyod_total: 0,
      repzo_total: 0,
      created: 0,
      updated: 0,
      failed: 0,
    };

    result.qoyod_total = qoyod_taxes?.taxes?.length;
    const db = new DataSet([], { autoIndex: false });
    db.createIndex({
      id: true,
      name: true,
      percentage: true,
      type: true,
    });
    db.load(qoyod_taxes?.taxes);

    const tax_query = qoyod_taxes?.taxes.map(
      (tax: QoyodTax) => `${nameSpace}_${tax.id}_${tax.type}`,
    );

    const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
      env: commandEvent.env,
    });
    const repzo_taxes = await repzo.tax.find({
      "integration_meta.id": tax_query,
    });
    result.repzo_total = repzo_taxes?.data?.length;
    for (let i = 0; i < qoyod_taxes.taxes.length; i++) {
      const qoyod_tax: QoyodTax = qoyod_taxes.taxes[i];
      const repzo_tax = repzo_taxes.data.find(
        (r_tax) => r_tax.integration_meta?.id == `${nameSpace}_${qoyod_tax.id}`,
      );

      const default_tax_type: "inclusive" | "additive" | "N/A" = "additive";

      const body = {
        _id: repzo_tax?._id,
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
        } catch (e: any) {
          console.log("Create Tax Failed >> ", e.response, body);
          result.failed++;
        }
      } else {
        const found_identical_docs = db.search({
          id: repzo_tax.integration_meta?.qoyod_id,
          name: repzo_tax.name,
          percentage: repzo_tax.integration_meta?.percentage,
        });
        if (found_identical_docs.length) continue;
        // Update
        try {
          const updated_tax = await repzo.tax.update(repzo_tax._id, body);
          result.updated++;
        } catch (e) {
          console.log("Update Tax Failed >> ", e, body);
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
