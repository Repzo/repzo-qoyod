import { CommandEvent, Result } from "../types";
export interface QoyodClient {
  id: number;
  name: string;
  organization?: string;
  email?: string;
  phone_number?: string;
  tax_number?: string;
  status: "Active" | "Inactive";
  created_at?: string;
  updated_at?: string;
}
export declare const addClients: (
  commandEvent: CommandEvent
) => Promise<Result>;
export declare const updatedInactiveClients: (
  commandEvent: CommandEvent
) => Promise<{
  qoyod_total: number;
  repzo_total: number;
  disabled: number;
  failed: number;
}>;
