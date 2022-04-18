import { Config, Action } from "../types";
import { EVENT } from "../types";
export declare const actions: (event: EVENT, options: Config) => Promise<void>;
export declare const actionsList: Action[];
