import jwt from "jsonwebtoken";
export interface Config {
  data?: any;
  repzoEndPoint: string;
  serviceEndPoint: string;
}
type DecodedScope = "admin" | "client" | "rep";

type StringId = string;
type Email = string;
type NameSpaces = string[];
export type Decoded = jwt.JwtPayload & {
  id?: StringId;
  email?: Email;
  name?: string;
  team?: StringId[];
  scope?: DecodedScope;
  nameSpace?: NameSpaces;
  permaString?: string;
  timezone?: string;
};
interface Params {
  nameSpace: NameSpaces;
  decoded: Decoded;
}
export type EVENT = AWSLambda.APIGatewayEvent & { params: Params };
export interface Action {
  name: string;
  action: string;
  description: string;
}

export interface Command {
  command: string;
  description: string;
  name: string;
}

export interface AvailableApp {
  _id: StringId;
  name: string;
  disabled: boolean;
  JSONSchema: any;
  UISchema: any;
  app_settings: { repo: string; serviceEndPoint: string; meta: {} };
  app_category: string;
}
export interface App {
  _id: StringId;
  name: string;
  disabled: boolean;
  available_app: AvailableApp;
  formData: any;
  company_namespace: string[];
}

export interface Command {
  command: string;
  description: string;
  name: string;
}

export interface Action {
  name: string;
  action: string;
  description: string;
}

export interface CommandEvent {
  app: App;
  command: string;
  nameSpace: NameSpaces;
  meta?: any;
  sync_id?: string;
  end_of_day: string;
  timezone: string;
  data?: any;
  env: "staging" | "production";
}
