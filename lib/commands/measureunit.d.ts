import { CommandEvent, Result } from "../types";
interface QoyodUnit {
  id: number;
  unit_name: string;
  unit_representation: string;
}
export interface QoyodUnits {
  product_unit_types: QoyodUnit[];
}
export declare const sync_measureunits: (
  commandEvent: CommandEvent
) => Promise<Result>;
export declare const get_qoyod_units: (
  serviceEndPoint: string,
  serviceApiKey: string,
  query?: string
) => Promise<QoyodUnits>;
export {};
