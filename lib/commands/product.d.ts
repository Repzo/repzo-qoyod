import { CommandEvent, Result } from "../types";
interface QoyodProduct {
  id: number;
  name_ar: string;
  name_en: string;
  description?: string;
  category_id: number;
  type: "Product";
  unit_type: number;
  unit: string;
  tax_id: number;
  is_inclusive: boolean;
  buying_price: string;
  selling_price: string;
  sku: string;
  barcode?: string;
  is_sold: boolean;
  is_bought: boolean;
  track_quantity: boolean;
  inventories?: {
    id: number;
    name_en: string;
    name_ar: string;
    stock: string;
  }[];
  ingredients?: [];
  unit_conversions?: {
    to_unit: number;
    from_unit: number;
    rate: string;
    barcode?: string;
    unit_purchase_price?: string;
    unit_selling_price?: string;
  }[];
}
export interface QoyodProducts {
  products: QoyodProduct[];
}
export declare const addProducts: (
  commandEvent: CommandEvent
) => Promise<Result>;
export declare const get_qoyod_products: (
  serviceEndPoint: string,
  serviceApiKey: string,
  query?: string
) => Promise<QoyodProducts>;
export {};
