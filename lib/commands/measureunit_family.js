import Repzo from "repzo";
import DataSet from "data-set-query";
import { get_qoyod_products } from "./product.js";
import { get_qoyod_units } from "./measureunit.js";
export const sync_measureunit_family = async (commandEvent) => {
    var _a, _b, _c, _d;
    try {
        console.log("sync_measureunit_family");
        const nameSpace = commandEvent.nameSpace.join("_");
        const result = {
            qoyod_total_families: 0,
            repzo_total: 0,
            created_families: 0,
            created_secondary_units: 0,
            updated: 0,
            failed: 0,
        };
        const qoyod_products = await get_qoyod_products(commandEvent.app.available_app.app_settings.serviceEndPoint, commandEvent.app.formData.serviceApiKey);
        result.qoyod_total_families = (_a = qoyod_products === null || qoyod_products === void 0 ? void 0 : qoyod_products.products) === null || _a === void 0 ? void 0 : _a.length;
        const qoyod_units = await get_qoyod_units(commandEvent.app.available_app.app_settings.serviceEndPoint, commandEvent.app.formData.serviceApiKey);
        const qoyod_measureunit_families = {};
        const unique_measureunits = {};
        qoyod_products === null || qoyod_products === void 0 ? void 0 : qoyod_products.products.forEach((qoyod_product) => {
            var _a;
            const family_name = qoyod_product.sku;
            const family_measureunits = [];
            const family_base_unit = {
                id: qoyod_product.unit_type,
                factor: "1.0",
            };
            family_measureunits.push(family_base_unit);
            unique_measureunits[`${family_base_unit.id}_${family_base_unit.factor}`] =
                family_base_unit;
            (_a = qoyod_product.unit_conversions) === null || _a === void 0 ? void 0 : _a.map((unit) => {
                const secondary_unit = {
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
        const repzo = new Repzo((_b = commandEvent.app.formData) === null || _b === void 0 ? void 0 : _b.repzoApiKey, {
            env: commandEvent.env,
        });
        const repzo_base_unit = await repzo.measureunit.find({
            parent: "nil",
            factor: 1,
        });
        const repzo_base_unit_id = (repzo_base_unit === null || repzo_base_unit === void 0 ? void 0 : repzo_base_unit.data.length) == 1
            ? repzo_base_unit === null || repzo_base_unit === void 0 ? void 0 : repzo_base_unit.data[0]._id
            : undefined;
        if (!repzo_base_unit_id)
            throw new Error(`Repzo Base Unit was not found`);
        const repzo_measureunits = await repzo.measureunit.find({
            per_page: 50000,
        });
        for (let key in unique_measureunits) {
            const qoyod_measureunit = unique_measureunits[key];
            const repzo_measureunit = (_c = repzo_measureunits === null || repzo_measureunits === void 0 ? void 0 : repzo_measureunits.data) === null || _c === void 0 ? void 0 : _c.find((repzo_unit) => {
                var _a;
                return ((_a = repzo_unit.integration_meta) === null || _a === void 0 ? void 0 : _a.id) ==
                    `${nameSpace}_${qoyod_measureunit.id}_${qoyod_measureunit.factor}`;
            });
            if (!repzo_measureunit) {
                // Create measure unit
                const res = await create_measureunit({
                    repzo,
                    repzo_measureunits,
                    qoyod_measureunit,
                    nameSpace,
                    qoyod_units,
                    repzo_base_unit_id,
                    result,
                });
                if (res)
                    qoyod_measureunit.repzo_id = res;
                else
                    console.log(`Measure Unit with _id: ${qoyod_measureunit.id}`);
            }
            else {
                qoyod_measureunit.repzo_id = repzo_measureunit._id;
            }
        }
        const repzo_measureunit_families = await repzo.measureunitFamily.find({
            per_page: 50000,
        });
        const db = new DataSet([], { autoIndex: false });
        db.createIndex({
            _id: true,
            name: true,
        });
        db.load(repzo_measureunit_families === null || repzo_measureunit_families === void 0 ? void 0 : repzo_measureunit_families.data);
        const measureunit_families = Object.values(qoyod_measureunit_families).map((family) => {
            return {
                name: family.name,
                measureunits: family.measureunits
                    .map((unit) => { var _a; return (_a = unique_measureunits[`${unit.id}_${unit.factor}`]) === null || _a === void 0 ? void 0 : _a.repzo_id; })
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
            const repzo_family = repzo_measureunit_families.data.find((r_family) => { var _a, _b; return ((_a = r_family.integration_meta) === null || _a === void 0 ? void 0 : _a.id) == ((_b = qoyod_family.integration_meta) === null || _b === void 0 ? void 0 : _b.id); });
            if (!repzo_family) {
                // Create
                try {
                    const created_family = await repzo.measureunitFamily.create(qoyod_family);
                    result.created_families++;
                }
                catch (e) {
                    console.log("Create Measure Unit Family Failed >> ", e.response, qoyod_family);
                    result.failed++;
                }
            }
            else {
                const found_identical_docs = db.search({
                    _id: repzo_family._id,
                    name: qoyod_family.name,
                });
                const has_all_measureunits = found_identical_docs.length &&
                    ((_d = found_identical_docs[0].measureunits) === null || _d === void 0 ? void 0 : _d.length) ==
                        qoyod_family.measureunits.length &&
                    !found_identical_docs[0].measureunits.filter((r_u) => !qoyod_family.measureunits.find((q_u) => q_u == r_u)).length;
                if (found_identical_docs.length && has_all_measureunits)
                    continue;
                // Update
                try {
                    const updated_family = await repzo.measureunitFamily.update(repzo_family._id, qoyod_family);
                    result.updated++;
                }
                catch (e) {
                    console.log("Update Measure Unit Failed >> ", e, qoyod_family);
                    result.failed++;
                }
            }
        }
        console.log(result);
        return result;
    }
    catch (e) {
        //@ts-ignore
        console.error(e.response.data);
        throw e === null || e === void 0 ? void 0 : e.response;
    }
};
const create_measureunit = async ({ repzo, qoyod_measureunit, repzo_measureunits, nameSpace, qoyod_units, repzo_base_unit_id, result, }) => {
    var _a, _b;
    try {
        const matched_base_unit = (_a = qoyod_units === null || qoyod_units === void 0 ? void 0 : qoyod_units.product_unit_types) === null || _a === void 0 ? void 0 : _a.find((base_unit) => base_unit.id == qoyod_measureunit.id);
        if (!matched_base_unit) {
            result.failed++;
            throw new Error(`Create Secondary Measure unit Failed >> MeasureUnit with integration_meta.id: ${nameSpace}_${qoyod_measureunit.id} was not found`);
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
            (_b = repzo_measureunits === null || repzo_measureunits === void 0 ? void 0 : repzo_measureunits.data) === null || _b === void 0 ? void 0 : _b.push(created_unit);
            return created_unit._id;
        }
        catch (e) {
            console.log("Create Measure Unit Failed >> ", e.response, body);
            result.failed++;
        }
    }
    catch (e) {
        throw e;
    }
};
