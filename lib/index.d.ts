export declare const Actions: (event: import("./types.js").EVENT, options: import("./types.js").Config) => Promise<{
    created: number;
    failed: number;
}>;
export declare const ActionsList: import("./types.js").Action[];
export declare const Commands: (CommandEvent: import("./types.js").CommandEvent) => Promise<import("./types.js").Result | {
    qoyod_total: number;
    repzo_total: number;
    disabled: number;
    failed: number;
    failed_msg: any[];
}>;
export declare const CommandsList: import("./types.js").Command[];
