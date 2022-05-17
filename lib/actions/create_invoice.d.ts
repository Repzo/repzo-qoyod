import { EVENT, Config } from "../types";
export declare const create_invoice: (event: EVENT, options: Config) => Promise<{
    created: number;
    failed: number;
}>;
