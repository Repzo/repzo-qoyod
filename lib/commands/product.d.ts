import { CommandEvent } from "../types";
export declare const addProducts: (commandEvent: CommandEvent) => Promise<{
    qoyod_total: number;
    repzo_total: number;
    created: number;
    updated: number;
    failed: number;
}>;
