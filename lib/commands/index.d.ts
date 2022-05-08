import { Command, CommandEvent } from "./../types";
export declare const commands: (CommandEvent: CommandEvent) => Promise<{
    qoyod_total: number;
    repzo_total: number;
    disabled: number;
    failed: number;
} | {
    created: number;
    failed: number;
}>;
export declare const commandsList: Command[];
