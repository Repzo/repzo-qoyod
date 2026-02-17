import axios from "axios";
import Repzo from "repzo";

const DEFAULT_PER_PAGE = 200;
const DEFAULT_TOTAL_PAGES = 1000;

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

interface QoyodApiResponse {
  pagination?: {
    totalPages?: number;
  };
  products?: any[];
  invoices?: any[];
  categories?: any[];
  customers?: any[];
  inventories?: any[];
  product_unit_types?: any[];
}

export const _fetch = async (
  baseUrl: string,
  path: string,
  headers?: Headers,
  params?: Params
) => {
  try {
    const res = await axios.get(baseUrl + path, { params, headers });
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
  params?: Params
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
  params?: Params
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
  params?: Params
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
  value: string
): Promise<void> => {
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

export const updateAt_query = (
  QUERY: string,
  options_formData: any,
  bench_time_key: string
): string => {
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

export const get_data_from_qoyod = async ({
  _path,
  default_res,
  serviceEndPoint,
  serviceApiKey,
  query,
  entityName,
}: {
  _path:
    | "invoices"
    | "categories"
    | "customers"
    | "inventories"
    | "product_unit_types"
    | "products";
  default_res: any; // if no data was found
  serviceEndPoint: string;
  serviceApiKey: string;
  query?: string;
  entityName:
    | "invoices"
    | "categories"
    | "customers"
    | "inventories"
    | "product_unit_types"
    | "products";
}): Promise<{ [key: string]: any }[] | any> => {
  try {
    const all_data: { [key: string]: any }[] = [];
    let total_pages = DEFAULT_TOTAL_PAGES;
    let check_getting_same_page_data_each_loop = true;
    for (let page = 1; page <= total_pages; page++) {
      let QUERY = query ? query : "";
      if (QUERY && !QUERY.startsWith("?")) QUERY = "?" + QUERY;
      try {
        const result: QoyodApiResponse = (await _fetch(
          serviceEndPoint,
          `/${_path}${QUERY}${
            QUERY ? "&" : "?"
          }page=${page}&per_page=${DEFAULT_PER_PAGE}`,
          { "API-KEY": serviceApiKey }
        )) as unknown as QoyodApiResponse;
        if (result?.pagination?.totalPages) {
          total_pages = result.pagination.totalPages;
        }
        const entityData = result[entityName];
        if (result && entityData && entityData.length > 0) {
          if (page > 1 && check_getting_same_page_data_each_loop) {
            const first_doc_in_page_2 = entityData[0];
            const has_matching_doc_in_page_1 = all_data.some(
              (item) => item.id === first_doc_in_page_2.id
            );
            if (has_matching_doc_in_page_1) {
              console.warn(
                `Warning: Getting same data in page ${page} as in page 1, this might indicate an issue with pagination in Qoyod's API, or that the data is not changing. Stopping further requests to avoid infinite loop.`
              );
              break;
            } else {
              check_getting_same_page_data_each_loop = false; // if the data in page 2 is different than page 1, then we can continue as normal
            }
          }
          entityData.forEach((item: any) => {
            all_data.push(item);
          });
          if (
            entityData.length < DEFAULT_PER_PAGE ||
            entityData.length > DEFAULT_PER_PAGE
          ) {
            break; // No more data to fetch
          }
        } else {
          break; // No more data to fetch
        }
      } catch (e: any) {
        console.error(e);
        if (e.response?.status == 404) break; // No more data to fetch
        throw e;
      }
    }
    return all_data.length > 0 ? all_data : default_res;
  } catch (e: any) {
    if (e.response?.status == 404) return default_res;
    throw e;
  }
};

export const set_error = (error_res: any): any => {
  try {
    if (error_res) {
      if (typeof error_res == "string") {
        return { message: error_res };
      } else if (error_res.message || error_res.response?.data) {
        return {
          code: error_res.response?.data?.code,
          message: error_res.response?.data.message || error_res.message,
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
