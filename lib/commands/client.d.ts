import { CommandEvent } from "../types";
export declare const addClients: (commandEvent: CommandEvent) => Promise<{
    qoyod_total: number;
    repzo_total: number;
    created: number;
    updated: number;
    failed: number;
}>;
export declare const updatedInactiveClients: (commandEvent: CommandEvent) => Promise<{
    qoyod_total: number;
    repzo_total: number;
    disabled: number;
    failed: number;
}>;
