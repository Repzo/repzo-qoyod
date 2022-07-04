import { Config, Action } from "../types";
import { EVENT } from "../types";
import { create_invoice } from "./create_invoice.js";
import { create_payment } from "./create_payment.js";
// import { create_transfer } from "./create_transfer.js";
import { create_client } from "./create_client.js";
import { create_refund } from "./create_refund.js";
import { create_creditNote } from "./create_return_invoice.js";

export const actions = async (event: any, options: Config) => {
  switch (event.queryStringParameters?.action) {
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
      throw `Route: ${event.queryStringParameters?.action} not found`;
  }
};

export const actionsList: Action[] = [
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
