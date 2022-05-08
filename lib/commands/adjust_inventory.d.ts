import { CommandEvent } from "../types";
export declare const adjust_inventory: (commandEvent: CommandEvent) => Promise<{
    qoyod_total: number;
    repzo_total: number;
    created: number;
    updated: number;
    failed: number;
}>;
