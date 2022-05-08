import { addInvoice } from "./addInvoice.js";
export const actions = async (event, options) => {
    var _a;
    switch ((_a = event.queryStringParameters) === null || _a === void 0 ? void 0 : _a.action) {
        case "add_invoice":
            return await addInvoice(event, options);
        default:
            throw "Route not found";
    }
};
export const actionsList = [
    {
        action: "add_invoice",
        name: "add invoice",
        description: "add invoice ..",
    },
];
