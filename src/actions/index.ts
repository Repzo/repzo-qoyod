import { Config, Action } from "../types";
import { addInvoice } from "./addInvoice.js";
import { EVENT } from "../types";
export const actions = async (event: EVENT, options: Config) => {
  switch (event.queryStringParameters?.action) {
    case "add_invoice":
      return await addInvoice(event, options);
    default:
      throw "Route not found";
  }
};

export const actionsList: Action[] = [
  {
    action: "add_invoice",
    name: "add invoice",
    description: "add invoice ..",
  },
];
