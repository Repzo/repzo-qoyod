import axios from "axios";
export const _fetch = async (baseUrl, path, headers, params) => {
  try {
    const res = await axios.get(baseUrl + path, { params, headers });
    return res.data;
  } catch (e) {
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
  } catch (e) {
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
  } catch (e) {
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
  } catch (e) {
    throw e;
  }
};
export const update_bench_time = async (repzo, app_id, key, value) => {
  try {
    const res = await repzo.integrationApp.update(app_id, {
      // options_formData: { [key]: value },
      [`options_formData.${key}`]: value,
    });
    // console.log(res);
  } catch (e) {
    throw e;
  }
};
export const updateAt_query = (QUERY, options_formData, bench_time_key) => {
  try {
    QUERY = QUERY || "";
    if (options_formData && options_formData[bench_time_key]) {
      QUERY += `${QUERY ? "&" : "?"}q[updated_at_gteq]=${
        options_formData[bench_time_key]
      }`;
    }
    return QUERY;
  } catch (e) {
    throw e;
  }
};
export const get_data_from_qoyod = async (
  _path,
  default_res, // if no data was found
  serviceEndPoint,
  serviceApiKey,
  query
) => {
  try {
    const result = await _fetch(
      serviceEndPoint,
      `/${_path}${query ? query : ""}`,
      { "API-KEY": serviceApiKey }
    );
    return result;
  } catch (e) {
    if (e.response.status == 404) return default_res;
    throw e;
  }
};
export const set_error = (error_res) => {
  var _a, _b, _c, _d;
  try {
    if (error_res) {
      if (typeof error_res == "string") {
        return { message: error_res };
      } else if (
        error_res.message ||
        ((_a = error_res.response) === null || _a === void 0 ? void 0 : _a.data)
      ) {
        return {
          code:
            (_c =
              (_b = error_res.response) === null || _b === void 0
                ? void 0
                : _b.data) === null || _c === void 0
              ? void 0
              : _c.code,
          message:
            ((_d = error_res.response) === null || _d === void 0
              ? void 0
              : _d.data.message) || error_res.message,
          // responseData: error_res.response?.data,
        };
      } else {
        return error_res;
      }
    }
    return error_res;
  } catch (e) {
    throw e;
  }
};
