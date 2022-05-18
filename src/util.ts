import axios from "axios";
import Repzo from "repzo";

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

export const _fetch = async (
  baseUrl: string,
  path: string,
  headers?: Headers,
  params?: Params,
) => {
  try {
    const res = await axios.get(baseUrl + path, {
      params,
      headers,
    });
    return res.data;
  } catch (e) {
    throw e;
  }
};

export const _create = async (
  baseUrl: string,
  path: string,
  body: Data,
  headers?: Headers,
  params?: Params,
) => {
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

export const _update = async (
  baseUrl: string,
  path: string,
  body: Data,
  headers?: Headers,
  params?: Params,
) => {
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

export const _delete = async (
  baseUrl: string,
  path: string,
  headers?: Headers,
  params?: Params,
) => {
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

export const update_bench_time = async (
  repzo: Repzo,
  app_id: string,
  key: string,
  value: string,
): Promise<void> => {
  try {
    const res = await repzo.integrationApp.update(app_id, {
      // options_formData: { [key]: value },
      [`options_formData.${key}`]: value,
    });
    console.log(res);
  } catch (e) {
    throw e;
  }
};

export const updateAt_query = (
  QUERY: string,
  options_formData: any,
  bench_time_key: string,
): string => {
  try {
    QUERY = QUERY || "";
    if (options_formData && options_formData[bench_time_key]) {
      QUERY += `${QUERY ? "&" : ""}q[updated_at_gteq]=${
        options_formData[bench_time_key]
      }`;
    }
    return QUERY;
  } catch (e) {
    throw e;
  }
};
