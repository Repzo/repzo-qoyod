import Repzo from "repzo";
import DataSet from "data-set-query";
import { _fetch } from "../util.js";
export const addClients = async (commandEvent) => {
    var _a, _b, _c;
    try {
        console.log("addClients");
        const nameSpace = commandEvent.nameSpace.join("_");
        const result = {
            qoyod_total: 0,
            repzo_total: 0,
            created: 0,
            updated: 0,
            failed: 0,
        };
        const qoyod_clients = await get_qoyod_clients(commandEvent.app.available_app.app_settings.serviceEndPoint, commandEvent.app.formData.serviceApiKey, "?q[status_eq]=Active");
        result.qoyod_total = (_a = qoyod_clients === null || qoyod_clients === void 0 ? void 0 : qoyod_clients.customers) === null || _a === void 0 ? void 0 : _a.length;
        const db = new DataSet([], { autoIndex: false });
        db.createIndex({
            id: true,
            name: true,
            organization: true,
            email: true,
            phone_number: true,
            tax_number: true,
            status: true,
        });
        db.load(qoyod_clients === null || qoyod_clients === void 0 ? void 0 : qoyod_clients.customers);
        const client_meta = qoyod_clients === null || qoyod_clients === void 0 ? void 0 : qoyod_clients.customers.map((client) => `${nameSpace}_${client.id}`); // ??
        const repzo = new Repzo((_b = commandEvent.app.formData) === null || _b === void 0 ? void 0 : _b.repzoApiKey, {
            env: commandEvent.env,
        });
        const repzo_clients = await repzo.client.find({
            "integration_meta.id": client_meta,
            // project:["_id", "name", "integration_meta", "disabled", "email", "phone", "tax_number"]
        });
        result.repzo_total = (_c = repzo_clients === null || repzo_clients === void 0 ? void 0 : repzo_clients.data) === null || _c === void 0 ? void 0 : _c.length;
        for (let i = 0; i < qoyod_clients.customers.length; i++) {
            const qoyod_client = qoyod_clients.customers[i];
            const repzo_client = repzo_clients.data.find((r_client) => { var _a; return ((_a = r_client.integration_meta) === null || _a === void 0 ? void 0 : _a.id) == `${nameSpace}_${qoyod_client.id}`; });
            const body = {
                _id: repzo_client === null || repzo_client === void 0 ? void 0 : repzo_client._id,
                name: qoyod_client.name,
                client_code: "" + qoyod_client.id,
                disabled: qoyod_client.status == "Active" ? false : true,
                // organization is it the chain ????
                // cell_phone: qoyod_client.phone_number,
                phone: qoyod_client.phone_number,
                email: qoyod_client.email,
                tax_number: qoyod_client.tax_number,
                integration_meta: {
                    id: `${nameSpace}_${qoyod_client.id}`,
                    qoyod_id: qoyod_client.id,
                },
            };
            if (!repzo_client) {
                // Create
                try {
                    const created_client = await repzo.client.create(body);
                    result.created++;
                }
                catch (e) {
                    console.log("Create Client Failed >> ", e.response, body);
                    result.failed++;
                }
            }
            else {
                const found_identical_docs = db.search(from_repzo_to_qoyod(repzo_client));
                if (found_identical_docs.length)
                    continue;
                // Update
                try {
                    const updated_client = await repzo.client.update(repzo_client._id, body);
                    result.updated++;
                }
                catch (e) {
                    console.log("Update Client Failed >> ", e, body);
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
export const updatedInactiveClients = async (commandEvent) => {
    var _a, _b, _c;
    try {
        console.log("updatedInactiveClients");
        const nameSpace = commandEvent.nameSpace.join("_");
        const result = {
            qoyod_total: 0,
            repzo_total: 0,
            disabled: 0,
            failed: 0,
        };
        const qoyod_clients = await get_qoyod_clients(commandEvent.app.available_app.app_settings.serviceEndPoint, commandEvent.app.formData.serviceApiKey, "?q[status_eq]=Inactive");
        result.qoyod_total = (_a = qoyod_clients === null || qoyod_clients === void 0 ? void 0 : qoyod_clients.customers) === null || _a === void 0 ? void 0 : _a.length;
        const client_meta = qoyod_clients === null || qoyod_clients === void 0 ? void 0 : qoyod_clients.customers.map((client) => `${nameSpace}_${client.id}`); // ??
        const repzo = new Repzo((_b = commandEvent.app.formData) === null || _b === void 0 ? void 0 : _b.repzoApiKey, {
            env: commandEvent.env,
        });
        const repzo_clients = await repzo.client.find({
            "integration_meta.id": client_meta,
        });
        result.repzo_total = (_c = repzo_clients === null || repzo_clients === void 0 ? void 0 : repzo_clients.data) === null || _c === void 0 ? void 0 : _c.length;
        for (let i = 0; i < qoyod_clients.customers.length; i++) {
            const qoyod_client = qoyod_clients.customers[i];
            const repzo_client = repzo_clients.data.find((r_client) => { var _a; return ((_a = r_client.integration_meta) === null || _a === void 0 ? void 0 : _a.id) == `${nameSpace}_${qoyod_client.id}`; });
            if (repzo_client) {
                // Disabled
                try {
                    const disabled_client = await repzo.client.remove(repzo_client._id);
                    result.disabled++;
                }
                catch (e) {
                    console.log("Disable Client Failed >> ", e);
                    result.failed++;
                }
            }
        }
        console.log(result);
        return result;
    }
    catch (e) {
        //@ts-ignore
        console.error(e);
        throw e;
    }
};
const get_qoyod_clients = async (serviceEndPoint, serviceApiKey, query) => {
    try {
        const qoyod_clients = await _fetch(serviceEndPoint, `/customers${query ? query : ""}`, { "API-KEY": serviceApiKey });
        return qoyod_clients;
    }
    catch (e) {
        // code instead of msg
        if (e.response.data ==
            "We could not retrieve your customers, we found nothing.")
            return { customers: [] };
        throw e;
    }
};
const from_repzo_to_qoyod = (repzo_client) => {
    var _a;
    try {
        return {
            id: (_a = repzo_client.integration_meta) === null || _a === void 0 ? void 0 : _a.qoyod_id,
            name: repzo_client.name,
            organization: "",
            email: repzo_client.email,
            phone_number: repzo_client.phone,
            tax_number: repzo_client.tax_number,
            status: repzo_client.disabled ? "Inactive" : "Active",
        };
    }
    catch (e) {
        throw e;
    }
};
