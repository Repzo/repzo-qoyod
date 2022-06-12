import { EVENT, Config } from "../types";
export declare const create_transfer: (
  event: EVENT,
  options: Config
) => Promise<{
  created: number;
  failed: number;
  failed_msg: never[];
}>;