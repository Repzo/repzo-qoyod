import { Config, Action } from "../types";
import { addInvoice } from "./addInvoice.js";
import { EVENT } from "../types";
import { create_invoice } from "./create_invoice.js";
import { create_payment } from "./create_payment.js";

export const actions = async (event: EVENT, options: Config) => {
  switch (event.queryStringParameters?.action) {
    case "create_invoice":
      return await create_invoice(event, options);
    case "create_payment":
      return await create_payment(event, options);
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
    action: "create_payment",
    name: "create payment",
    description: "create payment ..",
  },
];
