import axios from "axios";
export const _fetch = async (baseUrl, path, headers, params) => {
    try {
        const res = await axios.get(baseUrl + path, {
            params,
            headers,
        });
        return res.data;
    }
    catch (e) {
        throw e;
    }
};
export const _create = async (baseUrl, path, body, headers, params) => {
    try {
        const res = await axios.post(baseUrl + path, body, {
            params,
            headers,
        });
        return res.data;
    }
    catch (e) {
        throw e;
    }
};
export const _update = async (baseUrl, path, body, headers, params) => {
    try {
        const res = await axios.put(baseUrl + path, body, {
            params,
            headers,
        });
        return res.data;
    }
    catch (e) {
        throw e;
    }
};
export const _delete = async (baseUrl, path, headers, params) => {
    try {
        const res = await axios.delete(baseUrl + path, {
            params,
            headers,
        });
        return res.data;
    }
    catch (e) {
        throw e;
    }
};
