import { Config, Action } from "../types";
import { EVENT } from "../types";
export declare const actions: (event: EVENT, options: Config) => Promise<{
    created: number;
    failed: number;
}>;
export declare const actionsList: Action[];
