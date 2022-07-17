import { Command, CommandEvent, Result } from "./../types";
export declare const commands: (CommandEvent: CommandEvent) => Promise<
  | void
  | Result
  | {
      qoyod_total: number;
      repzo_total: number;
      disabled: number;
      failed: number;
    }
>;
export declare const commandsList: Command[];
