import { CommandEvent } from "../types";
export declare const sync_username_account_id: (
  commandEvent: CommandEvent
) => Promise<{
  total_reps_with_accounts_ids: number;
  repzo_reps: number;
  unset: number;
  created: number;
  updated: number;
  failed: number;
}>;
