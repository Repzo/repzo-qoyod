let commandEvent = {
  app: {
    _id: "628397700cf4f813aa63b52c",
    name: "Qoyod",
    disabled: false,
    available_app: {
      _id: "6249fbdbe907f6a0d68a7058",
      name: "repzo-qoyod",
      disabled: false,
      JSONSchema: {
        title: "Qoyod Integration Settings",
        type: "object",
        required: [Array],
        properties: [Object],
      },
      app_settings: {
        repo: "",
        serviceEndPoint: "https://www.qoyod.com/api/2.0",
        meta: {},
      },
      app_category: "6249fa8466312f76e595634a",
      UISchema: {},
    },
    formData: {
      client: {
        clientHook: true,
      },
      invoices: {
        createInvoiceHook: true,
      },
      payment: {
        createPaymentHook: true,
      },
      bench_time_client: "2022-05-18T09:16:00.000Z",
      serviceApiKey: "6a0226eb2f2fabdffbffd9b22",
      repzoApiKey: "VwNcaz2830dLsQYbs0krf_cnHdJ8gMXM_p6OPoM2Ruk",
      paymentAccountId: 7,
      errorEmail: "mohammad.khamis@repzoapp.com",
    },
    options_formData: {},
    company_namespace: ["intgqoyod"],
    createdAt: "2022-05-17T12:39:12.338Z",
    updatedAt: "2022-05-18T10:26:15.172Z",
    __v: 0,
  },
  command: "join",
  // command: "update_disable_client",
  // command: "sync_inventory",
  // command: "sync_tax",
  // command: "sync_category",
  // command: "sync_measureunit",
  // command: "sync_measureunit_family",
  // command: "add_product",
  // command: "adjust_inventory",
  end_of_day: "04:00",
  nameSpace: ["intgqoyod"],
  timezone: "Asia/Amman",
  meta: '{\r\n "test":"hi", "invoice_id": "626a58f9eaf66e59747e0460" \r\n}',
  sync_id: undefined,
  env: "staging", // ""staging|production|local""
};
// {
//   app: {
//     _id: "628397700cf4f813aa63b52c",
//     name: "Qoyod",
//     disabled: false,
//     available_app: {
//       _id: "6249fbdbe907f6a0d68a7058",
//       name: "repzo-qoyod",
//       disabled: false,
//       JSONSchema: {
//         title: "Qoyod Integration Settings",
//         type: "object",
//         required: [Array],
//         properties: [Object],
//       },
//       app_settings: {
//         repo: "",
//         serviceEndPoint: "https://www.qoyod.com/api/2.0",
//         meta: {},
//       },
//       app_category: "6249fa8466312f76e595634a",
//       UISchema: {},
//     },
//     formData: {
//       client: { clientHook: true },
//       invoices: { createInvoiceHook: true },
//       serviceApiKey: "6a0226eb2f2fabdffbffd9b22",
//       repzoApiKey: "F1EE399QVWqmWd4UaRA2Ztv7WxALNQivFeKl0JR8_QE", // "shQbkfYx8YEJ0T6Co_iYjtynqA5izeEKOc70vUUD8Is",
//       errorEmail: "mohammad.khamis@repzoapp.com",
//     },
//     options_formData: {},
//     company_namespace: ["demoma"], // demosv
//   },
//   command: "add_client",
//   end_of_day: "04:00",
//   nameSpace: ["demoma"], // demosv
//   timezone: "Asia/Amman",
//   meta: '{\r\n "test":"hi", "invoice_id": "626a58f9eaf66e59747e0460" \r\n}',
//   sync_id: undefined,
//   env: "staging", // ""staging|production|local""
// };
import { Commands } from "./index.js";
Commands(commandEvent);
/*
import { CommandEvent, Result } from "./types";
let commandEvent: CommandEvent = {
  app: {
    _id: "624a02d76f904d49c95fbee7",
    name: "Qoyod",
    disabled: false,
    available_app: {
      _id: "6249fbdbe907f6a0d68a7058",
      name: "repzo-qoyod",
      disabled: false,
      JSONSchema: {
        title: "Qoyod Integration Settings",
        type: "object",
        required: [Array],
        properties: [Object],
      },
      app_settings: {
        repo: "",
        serviceEndPoint: "https://www.qoyod.com/api/2.0",
        meta: {},
      },
      app_category: "6249fa8466312f76e595634a",
      UISchema: {},
    },
    formData: {
      client: { clientHook: true },
      invoices: { createInvoiceHook: true },
      serviceApiKey: "6a0226eb2f2fabdffbffd9b22",
      repzoApiKey: "F1EE399QVWqmWd4UaRA2Ztv7WxALNQivFeKl0JR8_QE", // "shQbkfYx8YEJ0T6Co_iYjtynqA5izeEKOc70vUUD8Is",
      errorEmail: "mohammad.khamis@repzoapp.com",
    },
    company_namespace: ["demoma"], // demosv
  },
  command: "add_client",
  end_of_day: "04:00",
  nameSpace: ["demoma"], // demosv
  timezone: "Asia/Amman",
  meta: '{\r\n    "test":"hi"\r\n}',
  sync_id: undefined,
  env: "staging", // ""staging|production|local""
};

import { Commands } from "./index.js";
Commands(commandEvent);
*/
