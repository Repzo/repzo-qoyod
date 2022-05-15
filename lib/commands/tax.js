import Repzo from "repzo";
import DataSet from "data-set-query";
const qoyod_taxes = {
    taxes: [
        { id: 1, name: "15% VAT", percentage: 15 },
        { id: 2, name: "Zero VAT", percentage: 0 },
        { id: 3, name: "VAT Exempt", percentage: 0 },
    ],
};
export const sync_taxes = async (commandEvent) => {
    var _a, _b, _c, _d;
    try {
        console.log("sync_taxes");
        const nameSpace = commandEvent.nameSpace.join("_");
        const result = {
            qoyod_total: 0,
            repzo_total: 0,
            created: 0,
            updated: 0,
            failed: 0,
        };
        result.qoyod_total = (_a = qoyod_taxes === null || qoyod_taxes === void 0 ? void 0 : qoyod_taxes.taxes) === null || _a === void 0 ? void 0 : _a.length;
        const db = new DataSet([], { autoIndex: false });
        db.createIndex({
            id: true,
            name: true,
            percentage: true,
        });
        db.load(qoyod_taxes === null || qoyod_taxes === void 0 ? void 0 : qoyod_taxes.taxes);
        const tax_query = qoyod_taxes === null || qoyod_taxes === void 0 ? void 0 : qoyod_taxes.taxes.map((tax) => `${nameSpace}_${tax.id}`);
        const repzo = new Repzo((_b = commandEvent.app.formData) === null || _b === void 0 ? void 0 : _b.repzoApiKey, {
            env: commandEvent.env,
        });
        const repzo_taxes = await repzo.tax.find({
            "integration_meta.id": tax_query,
        });
        result.repzo_total = (_c = repzo_taxes === null || repzo_taxes === void 0 ? void 0 : repzo_taxes.data) === null || _c === void 0 ? void 0 : _c.length;
        for (let i = 0; i < qoyod_taxes.taxes.length; i++) {
            const qoyod_tax = qoyod_taxes.taxes[i];
            const repzo_tax = repzo_taxes.data.find((r_tax) => { var _a; return ((_a = r_tax.integration_meta) === null || _a === void 0 ? void 0 : _a.id) == `${nameSpace}_${qoyod_tax.id}`; });
            const default_tax_type = "additive";
            const body = {
                _id: repzo_tax === null || repzo_tax === void 0 ? void 0 : repzo_tax._id,
                name: qoyod_tax.name,
                rate: qoyod_tax.percentage / 100,
                disabled: false,
                type: default_tax_type,
                integration_meta: {
                    id: `${nameSpace}_${qoyod_tax.id}`,
                    qoyod_id: qoyod_tax.id,
                },
            };
            if (!repzo_tax) {
                // Create
                try {
                    const created_tax = await repzo.tax.create(body);
                    result.created++;
                }
                catch (e) {
                    console.log("Create Tax Failed >> ", e.response, body);
                    result.failed++;
                }
            }
            else {
                const found_identical_docs = db.search({
                    id: (_d = repzo_tax.integration_meta) === null || _d === void 0 ? void 0 : _d.qoyod_id,
                    name: repzo_tax.name,
                    percentage: repzo_tax.rate * 100,
                });
                if (found_identical_docs.length)
                    continue;
                // Update
                try {
                    const updated_tax = await repzo.tax.update(repzo_tax._id, body);
                    result.updated++;
                }
                catch (e) {
                    console.log("Update Tax Failed >> ", e, body);
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
