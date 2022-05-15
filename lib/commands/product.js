import Repzo from "repzo";
import DataSet from "data-set-query";
import { _fetch } from "../util.js";
export const addProducts = async (commandEvent) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    try {
        console.log("addProducts");
        const nameSpace = commandEvent.nameSpace.join("_");
        const result = {
            qoyod_total: 0,
            repzo_total: 0,
            created: 0,
            updated: 0,
            failed: 0,
        };
        const qoyod_products = await get_qoyod_products(commandEvent.app.available_app.app_settings.serviceEndPoint, commandEvent.app.formData.serviceApiKey);
        result.qoyod_total = (_a = qoyod_products === null || qoyod_products === void 0 ? void 0 : qoyod_products.products) === null || _a === void 0 ? void 0 : _a.length;
        const db = new DataSet([], { autoIndex: false });
        db.createIndex({
            id: true,
            name_ar: true,
            name_en: true,
            description: true,
            category_id: true,
            type: true,
            unit_type: true,
            unit: true,
            buying_price: true,
            selling_price: true,
            sku: true,
            barcode: true,
            tax_id: true,
            // is_sold: true,
            // is_bought: true,
            // inventories: true, // ??????
            // ingredients: true, // ??????
            // unit_conversions: true, // ??????
        });
        db.load(qoyod_products === null || qoyod_products === void 0 ? void 0 : qoyod_products.products);
        const product_query = qoyod_products === null || qoyod_products === void 0 ? void 0 : qoyod_products.products.map((product) => `${nameSpace}_${product.id}`); // ??
        const repzo = new Repzo((_b = commandEvent.app.formData) === null || _b === void 0 ? void 0 : _b.repzoApiKey, {
            env: commandEvent.env,
        });
        const repzo_products = await repzo.product.find({
            "integration_meta.id": product_query,
            withVariants: true,
        });
        result.repzo_total = (_c = repzo_products === null || repzo_products === void 0 ? void 0 : repzo_products.data) === null || _c === void 0 ? void 0 : _c.length;
        const repzo_categories = await repzo.category.find({ per_page: 50000 });
        const repzo_measureunits = await repzo.measureunit.find({
            per_page: 50000,
        });
        const repzo_taxes = await repzo.tax.find({ per_page: 50000 });
        for (let i = 0; i < qoyod_products.products.length; i++) {
            const qoyod_product = qoyod_products.products[i];
            const repzo_product = repzo_products.data.find((r_product) => { var _a; return ((_a = r_product.integration_meta) === null || _a === void 0 ? void 0 : _a.id) == `${nameSpace}_${qoyod_product.id}`; });
            const price = qoyod_product.selling_price
                ? Number(qoyod_product.selling_price) * 1000
                : qoyod_product.buying_price
                    ? Number(qoyod_product.buying_price) * 1000
                    : 0;
            const category = repzo_categories.data.find((cate) => {
                var _a;
                return ((_a = cate.integration_meta) === null || _a === void 0 ? void 0 : _a.id) ==
                    `${nameSpace}_${qoyod_product.category_id}`;
            });
            if (!category) {
                console.log(`Update product Failed >> Category with integration_meta.id: ${nameSpace}_${qoyod_product.category_id} was not found`);
                result.failed++;
                continue;
            }
            const measureunit = repzo_measureunits.data.find((unit) => {
                var _a;
                return ((_a = unit.integration_meta) === null || _a === void 0 ? void 0 : _a.id) ==
                    `${nameSpace}_${qoyod_product.unit_type}`;
            });
            if (!measureunit) {
                console.log(`Update product Failed >> MeasureUnit with integration_meta.id: ${nameSpace}_${qoyod_product.unit_type} was not found`);
                result.failed++;
                continue;
            }
            const tax = repzo_taxes.data.find((cate) => { var _a; return ((_a = cate.integration_meta) === null || _a === void 0 ? void 0 : _a.id) == `${nameSpace}_${qoyod_product.tax_id}`; });
            if (!tax) {
                console.log(`Update product Failed >> Tax with integration_meta.id: ${nameSpace}_${qoyod_product.tax_id} was not found`);
                result.failed++;
                continue;
            }
            const repzo_variant = (_d = repzo_product === null || repzo_product === void 0 ? void 0 : repzo_product.variants) === null || _d === void 0 ? void 0 : _d.find((variant) => { var _a; return ((_a = variant.integration_meta) === null || _a === void 0 ? void 0 : _a.id) == `${nameSpace}_${qoyod_product.id}`; });
            const body = {
                _id: repzo_product === null || repzo_product === void 0 ? void 0 : repzo_product._id,
                name: qoyod_product.name_en,
                local_name: qoyod_product.name_ar,
                sku: qoyod_product.sku,
                category: category._id,
                barcode: qoyod_product.barcode,
                sv_measureUnit: measureunit._id,
                description: qoyod_product.description,
                sv_tax: tax._id,
                // product_img: qoyod_product.,
                // measureunit_family: ,
                active: true,
                rsp: Math.round(price),
                integration_meta: {
                    id: `${nameSpace}_${qoyod_product.id}`,
                    qoyod_id: qoyod_product.id,
                    category_id: qoyod_product.category_id,
                    unit: qoyod_product.unit,
                    type: qoyod_product.type,
                    unit_type: qoyod_product.unit_type,
                    buying_price: qoyod_product.buying_price,
                    selling_price: qoyod_product.selling_price,
                    tax_id: qoyod_product.tax_id,
                },
                variants: [
                    {
                        _id: repzo_variant === null || repzo_variant === void 0 ? void 0 : repzo_variant._id,
                        product: repzo_product === null || repzo_product === void 0 ? void 0 : repzo_product._id,
                        disabled: false,
                        name: qoyod_product.sku,
                        price: Math.round(price),
                        integration_meta: {
                            id: `${nameSpace}_${qoyod_product.id}`,
                            qoyod_id: qoyod_product.id,
                        },
                    },
                ],
            };
            if (!repzo_product) {
                // Create
                try {
                    const created_product = await repzo.product.create(body);
                    result.created++;
                }
                catch (e) {
                    console.log("Create product Failed >> ", e.response, body);
                    result.failed++;
                }
            }
            else {
                const found_identical_docs = db.search({
                    id: (_e = repzo_product.integration_meta) === null || _e === void 0 ? void 0 : _e.qoyod_id,
                    name_ar: repzo_product.local_name,
                    name_en: repzo_product.name,
                    description: repzo_product.description,
                    category_id: (_f = repzo_product.integration_meta) === null || _f === void 0 ? void 0 : _f.category_id,
                    type: (_g = repzo_product.integration_meta) === null || _g === void 0 ? void 0 : _g.type,
                    unit_type: (_h = repzo_product.integration_meta) === null || _h === void 0 ? void 0 : _h.unit_type,
                    unit: (_j = repzo_product.integration_meta) === null || _j === void 0 ? void 0 : _j.unit,
                    buying_price: (_k = repzo_product.integration_meta) === null || _k === void 0 ? void 0 : _k.buying_price,
                    selling_price: (_l = repzo_product.integration_meta) === null || _l === void 0 ? void 0 : _l.selling_price,
                    sku: repzo_product.sku,
                    barcode: repzo_product.barcode,
                    tax_id: (_m = repzo_product.integration_meta) === null || _m === void 0 ? void 0 : _m.tax_id,
                });
                if (found_identical_docs.length)
                    continue;
                // Update
                try {
                    const updated_product = await repzo.product.update(repzo_product._id, body);
                    result.updated++;
                }
                catch (e) {
                    console.log("Update product Failed >> ", e, body);
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
