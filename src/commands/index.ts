import { Config, Command, CommandEvent } from "./../types";
import { addClients } from "./addClients.js";
import { EVENT } from "./../types";
export const commands = async (CommandEvent:CommandEvent) => {
  switch (CommandEvent.command) {
    case "add_client":
      return await addClients(CommandEvent);
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
