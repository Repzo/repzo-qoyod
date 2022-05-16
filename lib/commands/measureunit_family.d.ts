import { CommandEvent } from "../types";
export declare const sync_measureunit_family: (commandEvent: CommandEvent) => Promise<{
    qoyod_total_families: number;
    repzo_total: number;
    created_families: number;
    created_secondary_units: number;
    updated: number;
    failed: number;
}>;
