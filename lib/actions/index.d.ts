import { Config, Action } from "../types";
export declare const actions: (
  event: any,
  options: Config
) => Promise<{
  created: number;
  failed: number;
  failed_msg: never[];
}>;
export declare const actionsList: Action[];
