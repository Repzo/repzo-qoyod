import { CommandEvent, Result } from "./types";
let commandEvent: CommandEvent | any = {
  app: {
    _id: "68f770e535420321dd3a47e6",
    name: "Qoyod",
    disabled: false,
    available_app: {
      _id: "6249fbdbe907f6a0d68a7058",
      name: "repzo-qoyod",
      disabled: false,
      JSONSchema: {
        title: "Qoyod Integration Settings",
        type: "object",
        required: [
          "repzoApiKey",
          "serviceApiKey",
          "paymentAccountId",
          "refundAccountId",
        ],
        properties: {
          serviceApiKey: { type: "string", title: "Qoyoud API KEY" },
          repzoApiKey: { type: "string", title: "Repzo API KEY" },
          paymentAccountId: {
            type: "number",
            title: "Qoyod Payment Account Id",
          },
          refundAccountId: { type: "number", title: "Qoyod Refund Account Id" },
          errorEmail: {
            type: "string",
            format: "email",
            title: "Email in case of error",
          },
          client: {
            type: "object",
            title: "Clients",
            required: ["clientHook"],
            properties: {
              clientHook: {
                type: "boolean",
                title: "Live Sync Cleints from Repzo to Qoyoud",
                default: false,
              },
            },
          },
          invoices: {
            type: "object",
            title: "Invoices",
            required: [
              "createInvoiceHook",
              "createCreditNoteHook",
              "invoiceInitialStatus",
            ],
            properties: {
              createInvoiceHook: {
                type: "boolean",
                title: "Live Sync Invoices from Repzo to Qoyoud",
                default: false,
              },
              createCreditNoteHook: {
                type: "boolean",
                title: "Live Sync Credit Notes from Repzo to Qoyoud",
                default: false,
              },
              invoiceInitialStatus: {
                type: "string",
                title: "Default Invoice Status",
                default: "Draft",
                enum: ["Draft", "Approved"],
              },
              invoiceDefaultPaymentMethod: {
                type: "number",
                title: "Invoice Default Payment Method",
                default: 10,
                oneOf: [
                  { const: 10, title: "Cash" },
                  { const: 30, title: "Credit" },
                  { const: 42, title: "Payment to bank account" },
                  { const: 48, title: "Bank Card" },
                  { const: 1, title: "Not defined" },
                ],
              },
            },
          },
          payments: {
            type: "object",
            title: "Payment",
            required: ["createPaymentHook"],
            properties: {
              createPaymentHook: {
                type: "boolean",
                title: "Live Sync Payments from Repzo to Qoyoud",
                default: false,
              },
            },
          },
          refunds: {
            type: "object",
            title: "Refund",
            required: ["createRefundHook"],
            properties: {
              createRefundHook: {
                type: "boolean",
                title: "Live Sync Refunds from Repzo to Qoyoud",
                default: false,
              },
            },
          },
          transfer: {
            type: "object",
            title: "Transfer",
            required: ["createTransferHook"],
            properties: {
              createTransferHook: {
                type: "boolean",
                title: "Live Sync Transfers from Repzo to Qoyoud",
                default: false,
              },
            },
          },
          username_payment_account_id: {
            title: "Username / Payment Account _id",
            type: "array",
            items: {
              type: "object",
              required: ["username", "payment_account_id"],
              properties: {
                username: { type: "string", title: "Rep username" },
                payment_account_id: {
                  type: "number",
                  title: "Payment Account _id",
                },
                refund_account_id: {
                  type: "number",
                  title: "Refund Account _id",
                },
              },
            },
          },
        },
      },
      options_JSONSchema: {
        title: "Qoyod Integration Optional Settings",
        type: "object",
        required: [],
        properties: {
          bench_time_client: {
            title: "Bench Time: Clients",
            type: "string",
            format: "date-time",
          },
          bench_time_disabled_client: {
            title: "Bench Time: Disabled Clients",
            type: "string",
            format: "date-time",
          },
          bench_time_category: {
            title: "Bench Time: Product Categories",
            type: "string",
            format: "date-time",
          },
          bench_time_tax: {
            title: "Bench Time: Taxes",
            type: "string",
            format: "date-time",
          },
          bench_time_measureunit: {
            title: "Bench Time: Measure Units",
            type: "string",
            format: "date-time",
          },
          bench_time_inventory: {
            title: "Bench Time: Inventories",
            type: "string",
            format: "date-time",
          },
          bench_time_product: {
            title: "Bench Time: Products",
            type: "string",
            format: "date-time",
          },
        },
      },
      app_settings: {
        repo: "",
        _id: "6249fbdbe907f6a0d68a7059",
        serviceEndPoint: "https://api.qoyod.com/2.0",
        meta: {},
      },
      commands: [
        { command: "basic", name: "Basic", description: "" },
        { command: "join", name: "Join", description: "" },
        {
          command: "sync_username_account_id",
          name: "Sync Username Payment/Refund Account Id",
          description: "",
        },
        { command: "add_client", name: "Sync Clients", description: "" },
        {
          command: "update_disable_client",
          name: "Sync Disabled Cleints",
          description: "",
        },
        {
          command: "sync_category",
          name: "Sync Product Category",
          description: "",
        },
        { command: "sync_tax", name: "Sync Taxes", description: "" },
        {
          command: "sync_measureunit",
          name: "Sync Measure Units",
          description: "",
        },
        {
          command: "sync_measureunit_family",
          name: "Sync Measure Unit Families",
          description: "",
        },
        { command: "add_product", name: "Sync Products", description: "" },
        { command: "sync_inventory", name: "Sync Inventory", description: "" },
        {
          command: "adjust_inventory",
          name: "Adjust Inevntory",
          description: "",
        },
      ],
      app_category: "6249fa8466312f76e595634a",
      createdAt: "2022-04-03T19:56:11.345Z",
      updatedAt: "2023-12-12T12:00:06.495Z",
      __v: 0,
      actions: [
        {
          action: "create_invoice",
          name: "create invoice",
          description: "create invoice ..",
        },
        {
          action: "create_creditNote",
          name: "create credit note",
          description: "create credit note ..",
        },
        {
          action: "create_payment",
          name: "create payment",
          description: "create payment ..",
        },
        {
          action: "create_refund",
          name: "create refund",
          description: "create refund ..",
        },
        {
          action: "create_transfer",
          name: "create transfer",
          description: "create transfer ..",
        },
        {
          action: "create_client",
          name: "create client",
          description: "create client ..",
        },
      ],
      description:
        "The Easiest Cloud Accounting Software for Your Business.Qoyod offers professional invoices, inventory controls and more ...",
      logo: "https://repzo-media-service.s3.eu-west-2.amazonaws.com/demosv/image/2022/6/5/qoyod.png",
      title: "Qoyod",
      subscription_billing_mode: "free",
    },
    company_namespace: ["demosv"],
    formData: {
      serviceApiKey: "7397dcfd9a2446277c367acd7",
      repzoApiKey: "gJqC0br8neetx2VHICLKm3OeTdLMSbXB1Nn6xjvY0_w",
      paymentAccountId: 11,
      refundAccountId: 11,
      client: { clientHook: false },
      invoices: {
        createInvoiceHook: false,
        createCreditNoteHook: false,
        invoiceInitialStatus: "Draft",
        invoiceDefaultPaymentMethod: 10,
      },
      payments: { createPaymentHook: false },
      refunds: { createRefundHook: false },
      transfer: { createTransferHook: false },
      username_payment_account_id: [],
    },
    options_formData: {},
    createdAt: "2025-10-21T11:39:17.074Z",
    updatedAt: "2026-02-17T07:50:50.392Z",
    __v: 0,
  },

  // command: "basic",
  // command: "add_client",
  // command: "update_disable_client",
  // command: "sync_inventory",
  // command: "sync_tax",
  command: "sync_category",
  // command: "sync_measureunit",
  // command: "sync_measureunit_family",
  // command: "add_product",
  // command: "adjust_inventory",
  // command: "sync_username_account_id",

  end_of_day: "04:00",
  nameSpace: ["demosv"], // demosv
  timezone: "Asia/Amman",
  meta: "",
  sync_id: "55fe84e9-cf3c-4e52-8da1-69c2b2959a47",
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
