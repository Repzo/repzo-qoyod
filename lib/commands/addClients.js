import axios from "axios";
import Repzo from "repzo";
// var config = ;
export const addClients = async (commandEvent) => {
    var _a;
    try {
        let res = await axios({
            method: "GET",
            url: `${commandEvent.app.available_app.app_settings.serviceEndPoint}/customers`,
            headers: {
                "API-KEY": commandEvent.app.formData.serviceApiKey
            }
        });
        console.dir(res === null || res === void 0 ? void 0 : res.data, { depth: 3 });
        console.log(commandEvent);
        const repzo = new Repzo((_a = commandEvent.app.formData) === null || _a === void 0 ? void 0 : _a.repzoApiKey);
        let clients = await repzo.client.find({ name: "" });
        clients.data[0].name;
        if (Math.random() > 0.75)
            throw "Custom error for testing";
        return res === null || res === void 0 ? void 0 : res.data;
    }
    catch (e) {
        //@ts-ignore
        throw e;
        console.error(e);
    }
};
