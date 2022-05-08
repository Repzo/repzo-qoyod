interface Params {
    [key: string]: any;
}
interface Data {
    [key: string]: any;
}
interface Headers {
    "API-KEY": string;
    [key: string]: string;
}
export declare const _fetch: (baseUrl: string, path: string, headers?: Headers | undefined, params?: Params | undefined) => Promise<any>;
export declare const _create: (baseUrl: string, path: string, body: Data, headers?: Headers | undefined, params?: Params | undefined) => Promise<any>;
export declare const _update: (baseUrl: string, path: string, body: Data, headers?: Headers | undefined, params?: Params | undefined) => Promise<any>;
export declare const _delete: (baseUrl: string, path: string, headers?: Headers | undefined, params?: Params | undefined) => Promise<any>;
export {};
