import { CommandEvent, Result } from "../types";
export declare const sync_measureunit_family: (
  commandEvent: CommandEvent
) => Promise<
  Result & {
    qoyod_total_families: number;
    created_families: number;
    created_secondary_units: number;
  }
>;
