import axios from "axios";
export const _fetch = async (baseUrl, path, headers, params) => {
    try {
        const res = await axios.get(baseUrl + path, { params, headers });
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
export const update_bench_time = async (repzo, app_id, key, value) => {
    try {
        const res = await repzo.integrationApp.update(app_id, {
            // options_formData: { [key]: value },
            [`options_formData.${key}`]: value,
        });
        console.log(res);
    }
    catch (e) {
        throw e;
    }
};
export const updateAt_query = (QUERY, options_formData, bench_time_key) => {
    try {
        QUERY = QUERY || "";
        if (options_formData && options_formData[bench_time_key]) {
            QUERY += `${QUERY ? "&" : "?"}q[updated_at_gteq]=${options_formData[bench_time_key]}`;
        }
        return QUERY;
    }
    catch (e) {
        throw e;
    }
};
export const get_data_from_qoyod = async (_path, default_res, // if no data was found
serviceEndPoint, serviceApiKey, query) => {
    try {
        const result = await _fetch(serviceEndPoint, `/${_path}${query ? query : ""}`, { "API-KEY": serviceApiKey });
        return result;
    }
    catch (e) {
        if (e.response.status == 404)
            return default_res;
        throw e;
    }
};
