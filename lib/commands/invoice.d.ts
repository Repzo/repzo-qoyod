import { CommandEvent } from "../types";
export declare const sync_invoice: (commandEvent: CommandEvent) => Promise<{
  created: number;
  failed: number;
}>;
