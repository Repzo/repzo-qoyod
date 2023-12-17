export declare const Actions: (
  event: any,
  options: import("./types.js").Config
) => Promise<any>;
export declare const ActionsList: import("./types.js").Action[];
export declare const Commands: (
  CommandEvent: import("./types.js").CommandEvent
) => Promise<
  | void
  | import("./types.js").Result
  | {
      qoyod_total: number;
      repzo_total: number;
      disabled: number;
      failed: number;
    }
  | {
      total_reps_with_accounts_ids: number;
      repzo_reps: number;
      unset: number;
      created: number;
      updated: number;
      failed: number;
    }
>;
export declare const CommandsList: import("./types.js").Command[];
