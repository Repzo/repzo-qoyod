import { create_invoice } from "./create_invoice.js";
import { create_payment } from "./create_payment.js";
export const actions = async (event, options) => {
  var _a, _b;
  switch (
    (_a = event.queryStringParameters) === null || _a === void 0
      ? void 0
      : _a.action
  ) {
    case "create_invoice":
      return await create_invoice(event, options);
    case "create_payment":
      return await create_payment(event, options);
    default:
      throw `Route: ${
        (_b = event.queryStringParameters) === null || _b === void 0
          ? void 0
          : _b.action
      } not found`;
  }
};
export const actionsList = [
  {
    action: "create_invoice",
    name: "create invoice",
    description: "create invoice ..",
  },
  {
    action: "create_payment",
    name: "create payment",
    description: "create payment ..",
  },
];
