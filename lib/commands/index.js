import { addClients } from "./addClients.js";
export const commands = async (CommandEvent) => {
    switch (CommandEvent.command) {
        case "add_client":
            return await addClients(CommandEvent);
        default:
            throw "Route not found";
    }
};
export const commandsList = [
    {
        command: "add_invoice",
        name: "add invoice",
        description: "add invoice ..",
    },
];
