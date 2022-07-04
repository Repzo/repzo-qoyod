import { create_invoice } from "./create_invoice.js";
import { create_payment } from "./create_payment.js";
// import { create_transfer } from "./create_transfer.js";
import { create_client } from "./create_client.js";
import { create_refund } from "./create_refund.js";
import { create_creditNote } from "./create_return_invoice.js";
export const actions = async (event, options) => {
  var _a, _b;
  switch (
    (_a = event.queryStringParameters) === null || _a === void 0
      ? void 0
      : _a.action
  ) {
    case "create_invoice":
      return await create_invoice(event, options);
    case "create_creditNote":
      return await create_creditNote(event, options);
    case "create_payment":
      return await create_payment(event, options);
    // case "create_transfer":
    // return await create_transfer(event, options);
    case "create_client":
      return await create_client(event, options);
    case "create_refund":
      return await create_refund(event, options);
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
    action: "create_creditNote",
    name: "create credit note",
    description: "create credit note ..",
  },
  {
    action: "create_payment",
    name: "create payment",
    description: "create payment ..",
  },
  // {
  //   action: "create_transfer",
  //   name: "create transfer",
  //   description: "create transfer ..",
  // },
  {
    action: "create_client",
    name: "create client",
    description: "create client ..",
  },
  {
    action: "create_refund",
    name: "create refund",
    description: "create refund ..",
  },
];
