import { EVENT, Config } from "../types";
import { QoyodClient as QoyodClientResult } from "../commands/client";
export declare const create_client: (
  event: EVENT,
  options: Config
) => Promise<{
  contact: QoyodClientResult;
}>;
