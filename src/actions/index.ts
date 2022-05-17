import { Config, Action } from "../types";
import { addInvoice } from "./addInvoice.js";
import { EVENT } from "../types";
import { create_invoice } from "./create_invoice.js";

export const actions = async (event: EVENT, options: Config) => {
  switch (event.queryStringParameters?.action) {
    case "create_invoice":
      return await create_invoice(event, options);
    default:
      throw "Route not found";
  }
};

export const actionsList: Action[] = [
  {
    action: "create_invoice",
    name: "create invoice",
    description: "create invoice ..",
  },
];
