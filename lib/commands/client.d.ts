import { CommandEvent, Result } from "../types";
export declare const addClients: (
  commandEvent: CommandEvent
) => Promise<Result>;
export declare const updatedInactiveClients: (
  commandEvent: CommandEvent
) => Promise<{
  qoyod_total: number;
  repzo_total: number;
  disabled: number;
  failed: number;
}>;
