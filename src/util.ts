import axios from "axios";

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
