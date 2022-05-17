import { Command, CommandEvent } from "./../types";
export declare const commands: (CommandEvent: CommandEvent) => Promise<{
    qoyod_total: number;
    repzo_total: number;
    created: number;
    updated: number;
    failed: number;
} | {
    qoyod_total: number;
    repzo_total: number;
    disabled: number;
    failed: number;
} | {
    qoyod_total_families: number;
    repzo_total: number;
    created_families: number;
    created_secondary_units: number;
    updated: number;
    failed: number;
}>;
export declare const commandsList: Command[];
