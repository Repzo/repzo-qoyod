export declare const Actions: (event: import("./types.js").EVENT, options: import("./types.js").Config) => Promise<{
    created: number;
    failed: number;
}>;
export declare const ActionsList: import("./types.js").Action[];
export declare const Commands: (CommandEvent: import("./types.js").CommandEvent) => Promise<{
    qoyod_total: number;
    repzo_total: number;
    disabled: number;
    failed: number;
} | {
    created: number;
    failed: number;
} | {
    qoyod_total_families: number;
    repzo_total: number;
    created_families: number;
    created_secondary_units: number;
    updated: number;
    failed: number;
}>;
export declare const CommandsList: import("./types.js").Command[];
