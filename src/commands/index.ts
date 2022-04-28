import { Config, Command, CommandEvent } from "./../types";
import { addClients, updatedInactiveClients } from "./client.js";
import { addProducts } from "./product.js";
import { sync_categories } from "./category.js";
import { sync_measureunits } from "./measureunit.js";
import { sync_inventory } from "./inventory.js";
import { adjust_inventory } from "./adjust_inventory.js";
import { sync_invoice } from "./invoice.js";
import { EVENT } from "./../types";
export const commands = async (CommandEvent: CommandEvent) => {
  switch (CommandEvent.command) {
    case "add_client":
      return await addClients(CommandEvent);
    case "update_disable_client":
      return await updatedInactiveClients(CommandEvent);
    case "add_product":
      return await addProducts(CommandEvent);
    case "sync_category":
      return await sync_categories(CommandEvent);
    case "sync_measureunit":
      return await sync_measureunits(CommandEvent);
    case "sync_inventory":
      return await sync_inventory(CommandEvent);
    case "adjust_inventory":
      return await adjust_inventory(CommandEvent);
    case "sync_invoice":
      return await sync_invoice(CommandEvent);
    default:
      throw "Route not found";
  }
};

export const commandsList: Command[] = [
  {
    command: "add_invoice",
    name: "add invoice",
    description: "add invoice ..",
  },
];
