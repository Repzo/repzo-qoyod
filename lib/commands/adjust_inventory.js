import Repzo from "repzo";
import { _fetch } from "../util.js";
import { v4 as uuid } from "uuid";
export const adjust_inventory = async (commandEvent) => {
    var _a, _b;
    try {
        console.log("adjust_inventory");
        const nameSpace = commandEvent.nameSpace.join("_");
        const result = {
            qoyod_total: 0,
            repzo_total: 0,
            created: 0,
            updated: 0,
            failed: 0,
            failed_msg: [],
        };
        const qoyod_products = await get_qoyod_products(commandEvent.app.available_app.app_settings.serviceEndPoint, commandEvent.app.formData.serviceApiKey);
        const repzo = new Repzo((_a = commandEvent.app.formData) === null || _a === void 0 ? void 0 : _a.repzoApiKey, {
            env: commandEvent.env,
        });
        const repzo_warehouses = await repzo.warehouse.find({
            per_page: 50000,
            disabled: false,
        });
        const repzo_variants = await repzo.variant.find({
            per_page: 50000,
            disabled: false,
        });
        const repzo_measureunits = await repzo.measureunit.find({
            per_page: 50000,
        });
        const qoyod_inventories = {};
        qoyod_products.products.forEach((qoyod_product) => {
            var _a;
            (_a = qoyod_product.inventories) === null || _a === void 0 ? void 0 : _a.forEach((qoyod_product_inventory) => {
                qoyod_inventories[qoyod_product_inventory.id] =
                    qoyod_inventories[qoyod_product_inventory.id] || [];
                qoyod_inventories[qoyod_product_inventory.id].push({
                    id: qoyod_product.id,
                    sku: qoyod_product.sku,
                    unit_type: qoyod_product.unit_type,
                    unit: qoyod_product.unit,
                    stock: qoyod_product_inventory.stock,
                });
            });
        });
        for (let key in qoyod_inventories) {
            const qoyod_warehouse_id = key;
            const qoyod_inventory = qoyod_inventories[key];
            const repzo_warehouse = repzo_warehouses.data.find((warehouse) => { var _a; return ((_a = warehouse.integration_meta) === null || _a === void 0 ? void 0 : _a.qoyod_id) == qoyod_warehouse_id; });
            if (!repzo_warehouse) {
                console.log(`Adjust Inventory Failed >> Warehouse with integration_meta.qoyod_id: ${qoyod_warehouse_id} was not found`);
                result.failed++;
                continue;
            }
            const repzo_inventory = await repzo.inventory.find({
                warehouse_id: repzo_warehouse._id,
                per_page: 50000,
            });
            const variants = [];
            qoyod_inventory.forEach((qoyod_item) => {
                const repzo_variant = repzo_variants.data.find((variant) => { var _a; return ((_a = variant.integration_meta) === null || _a === void 0 ? void 0 : _a.qoyod_id) == qoyod_item.id; });
                if (!repzo_variant) {
                    console.log(`Adjust Inventory Failed >> Variant with integration_meta.qoyod_id: ${qoyod_item.id} was not found`);
                    result.failed++;
                    return;
                }
                const repzo_measureunit = repzo_measureunits.data.find((unit) => { var _a; return ((_a = unit.integration_meta) === null || _a === void 0 ? void 0 : _a.qoyod_id) == qoyod_item.unit_type; });
                if (!repzo_measureunit) {
                    console.log(`Adjust Inventory Failed >> Measure Unit with integration_meta.qoyod_id: ${qoyod_item.unit_type} was not found`);
                    result.failed++;
                    return;
                }
                const repzo_item = repzo_inventory.data.find((item) => item.variant_id.toString() == repzo_variant._id.toString());
                const qoyod_item_stock = Number(qoyod_item.stock);
                const qoyod_qty = repzo_measureunit.factor * qoyod_item_stock;
                const diff_qty = repzo_item ? qoyod_qty - repzo_item.qty : qoyod_qty;
                if (diff_qty)
                    variants.push({ variant: repzo_variant._id, qty: diff_qty });
            });
            const data = {
                time: Date.now(),
                sync_id: uuid(),
                to: repzo_warehouse._id,
                variants: variants,
            };
            console.log(data);
            if (!data.variants.length)
                continue;
            const adjust_inventory_res = await repzo.adjustInventory.create(data);
            result.created++;
        }
        console.log(result);
        return result;
    }
    catch (e) {
        //@ts-ignore
        console.error((_b = e === null || e === void 0 ? void 0 : e.response) === null || _b === void 0 ? void 0 : _b.data);
        throw e === null || e === void 0 ? void 0 : e.response;
    }
};
const get_qoyod_products = async (serviceEndPoint, serviceApiKey, query) => {
    try {
        const qoyod_products = await _fetch(serviceEndPoint, `/products${query ? query : ""}`, { "API-KEY": serviceApiKey });
        return qoyod_products;
    }
    catch (e) {
        if (
        // code instead of msg
        e.response.data ==
            "We could not retrieve your products, we found nothing.")
            return { products: [] };
        throw e;
    }
};
