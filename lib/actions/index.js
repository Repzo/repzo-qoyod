import { create_invoice } from "./create_invoice.js";
export const actions = async (event, options) => {
    var _a;
    switch ((_a = event.queryStringParameters) === null || _a === void 0 ? void 0 : _a.action) {
        case "create_invoice":
            return await create_invoice(event, options);
        default:
            throw "Route not found";
    }
};
export const actionsList = [
    {
        action: "create_invoice",
        name: "create invoice",
        description: "create invoice ..",
    },
];
