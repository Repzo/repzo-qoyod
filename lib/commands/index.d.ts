import { Command, CommandEvent, Result } from "./../types";
export declare const commands: (CommandEvent: CommandEvent) => Promise<Result | {
    qoyod_total: number;
    repzo_total: number;
    disabled: number;
    failed: number;
    failed_msg: any[];
}>;
export declare const commandsList: Command[];
