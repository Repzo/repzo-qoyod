import Repzo from "repzo";
import { set_error } from "../util.js";
import { v4 as uuid } from "uuid";
import { get_qoyod_products } from "./product.js";
export const adjust_inventory = async (commandEvent) => {
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
    const qoyod_products = await get_qoyod_products(
      commandEvent.app.available_app.app_settings.serviceEndPoint,
      commandEvent.app.formData.serviceApiKey
    );
    commandLog.addDetail(
      `${
        (_b = qoyod_products.products) === null || _b === void 0
          ? void 0
          : _b.length
      } Products in Qoyod`
    );
    const repzo_warehouses = await repzo.warehouse.find({
      per_page: 50000,
    });
    commandLog.addDetail(
      `${
        (_c =
          repzo_warehouses === null || repzo_warehouses === void 0
            ? void 0
            : repzo_warehouses.data) === null || _c === void 0
          ? void 0
          : _c.length
      } Warehouses in Repzo`
    );
    const repzo_variants = await repzo.variant.find({
      per_page: 50000,
      withProduct: true,
    });
    commandLog.addDetail(
      `${
        (_d =
          repzo_variants === null || repzo_variants === void 0
            ? void 0
            : repzo_variants.data) === null || _d === void 0
          ? void 0
          : _d.length
      } Variants in Repzo`
    );
    const repzo_measureunits = await repzo.measureunit.find({
      per_page: 50000,
    });
    commandLog.addDetail(
      `${
        (_e =
          repzo_measureunits === null || repzo_measureunits === void 0
            ? void 0
            : repzo_measureunits.data) === null || _e === void 0
          ? void 0
          : _e.length
      } Measure units Warehouses in Repzo`
    );
    const repzo_inventory = await repzo.inventory.find({
      per_page: 50000,
      export_behaviour: true,
    });
    commandLog.addDetail(
      `${
        (_f =
          repzo_inventory === null || repzo_inventory === void 0
            ? void 0
            : repzo_inventory.data) === null || _f === void 0
          ? void 0
          : _f.length
      } variants in all inventories on Repzo`
    );
    await commandLog.commit();
    const master_warehouse_product = {};
    (_g =
      qoyod_products === null || qoyod_products === void 0
        ? void 0
        : qoyod_products.products) === null || _g === void 0
      ? void 0
      : _g.forEach((qoyod_product) => {
          var _a;
          (_a = qoyod_product.inventories) === null || _a === void 0
            ? void 0
            : _a.forEach((qoyod_product_inventory) => {
                var _a, _b;
                const qoyod_warehouse_id = qoyod_product_inventory.id;
                const qoyod_product_id = qoyod_product.id;
                const qoyod_qty = Number(qoyod_product_inventory.stock);
                const repzo_warehouse =
                  (_a =
                    repzo_warehouses === null || repzo_warehouses === void 0
                      ? void 0
                      : repzo_warehouses.data) === null || _a === void 0
                    ? void 0
                    : _a.find((warehouse) => {
                        var _a, _b;
                        return (
                          ((_b =
                            (_a =
                              warehouse === null || warehouse === void 0
                                ? void 0
                                : warehouse.integration_meta) === null ||
                            _a === void 0
                              ? void 0
                              : _a.qoyod_id) === null || _b === void 0
                            ? void 0
                            : _b.toString()) ==
                          (qoyod_warehouse_id === null ||
                          qoyod_warehouse_id === void 0
                            ? void 0
                            : qoyod_warehouse_id.toString())
                        );
                      });
                if (!repzo_warehouse) {
                  console.log(
                    `Adjust Inventory Failed >> Warehouse with integration_meta.qoyod_id: ${qoyod_warehouse_id} was not found`
                  );
                  failed_docs_report.push({
                    method: "fetchingData",
                    doc: {
                      qoyod_warehouse_id,
                      qoyod_product:
                        qoyod_product === null || qoyod_product === void 0
                          ? void 0
                          : qoyod_product.id,
                      qoyod_product_name:
                        qoyod_product === null || qoyod_product === void 0
                          ? void 0
                          : qoyod_product.name_ar,
                    },
                    error_message: `Adjust Inventory Failed >> Warehouse with integration_meta.qoyod_id: ${qoyod_warehouse_id} was not found`,
                  });
                  result.failed++;
                  return;
                }
                const repzo_variant =
                  (_b =
                    repzo_variants === null || repzo_variants === void 0
                      ? void 0
                      : repzo_variants.data) === null || _b === void 0
                    ? void 0
                    : _b.find((variant) => {
                        var _a, _b;
                        return (
                          ((_b =
                            (_a =
                              variant === null || variant === void 0
                                ? void 0
                                : variant.integration_meta) === null ||
                            _a === void 0
                              ? void 0
                              : _a.qoyod_id) === null || _b === void 0
                            ? void 0
                            : _b.toString()) ==
                          (qoyod_product_id === null ||
                          qoyod_product_id === void 0
                            ? void 0
                            : qoyod_product_id.toString())
                        );
                      });
                if (!repzo_variant) {
                  console.log(
                    `Adjust Inventory Failed >> Variant with integration_meta.qoyod_id: ${qoyod_product_id} was not found`
                  );
                  failed_docs_report.push({
                    method: "fetchingData",
                    doc: {
                      qoyod_product_id,
                      qoyod_product:
                        qoyod_product === null || qoyod_product === void 0
                          ? void 0
                          : qoyod_product.id,
                      qoyod_product_name:
                        qoyod_product === null || qoyod_product === void 0
                          ? void 0
                          : qoyod_product.name_ar,
                    },
                    error_message: `Adjust Inventory Failed >> Variant with integration_meta.qoyod_id: ${qoyod_product_id} was not found`,
                  });
                  result.failed++;
                  return;
                }
                master_warehouse_product[
                  `${qoyod_warehouse_id}_${qoyod_product_id}`
                ] = {
                  qoyod_warehouse_id,
                  qoyod_product_id,
                  qoyod_qty,
                  repzo_warehouse_id:
                    repzo_warehouse === null || repzo_warehouse === void 0
                      ? void 0
                      : repzo_warehouse._id,
                  repzo_variant_id:
                    repzo_variant === null || repzo_variant === void 0
                      ? void 0
                      : repzo_variant._id,
                  repzo_qty: 0,
                };
              });
        });
    (_h =
      repzo_inventory === null || repzo_inventory === void 0
        ? void 0
        : repzo_inventory.data) === null || _h === void 0
      ? void 0
      : _h.forEach((repzo_product_inventory) => {
          var _a, _b;
          const repzo_warehouse_id = repzo_product_inventory.warehouse_id;
          const repzo_variant_id = repzo_product_inventory.variant_id;
          const repzo_qty = repzo_product_inventory.qty;
          const qoyod_product_id = Number(repzo_product_inventory.variant_name);
          const repzo_warehouse =
            (_a =
              repzo_warehouses === null || repzo_warehouses === void 0
                ? void 0
                : repzo_warehouses.data) === null || _a === void 0
              ? void 0
              : _a.find(
                  (warehouse) =>
                    warehouse._id.toString() == repzo_warehouse_id.toString()
                );
          if (!repzo_warehouse) {
            console.log(
              `Adjust Inventory Failed >> Warehouse with integration_meta.repzo_id: ${repzo_warehouse_id} was not found`
            );
            failed_docs_report.push({
              method: "fetchingData",
              doc: { repzo_product_inventory, repzo_variant_id },
              error_message: `Adjust Inventory Failed >> Warehouse with integration_meta.repzo_id: ${repzo_warehouse_id} was not found`,
            });
            result.failed++;
            return;
          }
          const qoyod_warehouse_id =
            (_b = repzo_warehouse.integration_meta) === null || _b === void 0
              ? void 0
              : _b.qoyod_id;
          const master_key = `${qoyod_warehouse_id}_${repzo_variant_id}`;
          if (master_warehouse_product[master_key]) {
            master_warehouse_product[master_key].repzo_qty = repzo_qty;
            master_warehouse_product[master_key].repzo_warehouse_id =
              repzo_warehouse_id;
            master_warehouse_product[master_key].repzo_variant_id =
              repzo_variant_id;
          } else {
            master_warehouse_product[master_key] = {
              qoyod_warehouse_id,
              qoyod_product_id,
              qoyod_qty: 0,
              repzo_warehouse_id,
              repzo_variant_id,
              repzo_qty,
            };
          }
        });
    const adjust_repzo_inventory = {};
    Object.values(master_warehouse_product).forEach((warehouse_product) => {
      const diff_qty =
        warehouse_product.qoyod_qty - warehouse_product.repzo_qty;
      if (diff_qty) {
        if (!adjust_repzo_inventory[warehouse_product.repzo_warehouse_id])
          adjust_repzo_inventory[warehouse_product.repzo_warehouse_id] = [];
        adjust_repzo_inventory[warehouse_product.repzo_warehouse_id].push({
          variant: warehouse_product.repzo_variant_id,
          qty: diff_qty,
        });
      }
    });
    for (let key in adjust_repzo_inventory) {
      const data = {
        time: Date.now(),
        sync_id: uuid(),
        to: key,
        variants: adjust_repzo_inventory[key],
      };
      // console.log(data);
      if (!data.variants.length) continue;
      try {
        const adjust_inventory_res = await repzo.adjustInventory.create(data);
        result.created++;
      } catch (e) {
        console.log(
          "Adjust Inventory Failed >> ",
          e === null || e === void 0 ? void 0 : e.response,
          data
        );
        failed_docs_report.push({
          method: "create",
          doc: data,
          error_message: set_error(e),
        });
        result.failed++;
      }
    }
    // console.log(result);
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
