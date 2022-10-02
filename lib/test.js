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
        required: [
          "repzoApiKey",
          "serviceApiKey",
          "paymentAccountId",
          "refundAccountId",
        ],
        properties: {
          serviceApiKey: {
            type: "string",
            title: "Qoyoud API KEY",
          },
          repzoApiKey: {
            type: "string",
            title: "Repzo API KEY",
          },
          paymentAccountId: {
            type: "number",
            title: "Qoyod Payment Account Id",
          },
          refundAccountId: {
            type: "number",
            title: "Qoyod Refund Account Id",
          },
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
        serviceEndPoint: "https://www.qoyod.com/api/2.0",
        meta: {},
      },
      commands: [
        {
          command: "basic",
          name: "Basic",
          description: "",
        },
        {
          command: "join",
          name: "Join",
          description: "",
        },
        {
          command: "add_client",
          name: "Sync Clients",
          description: "",
        },
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
        {
          command: "sync_tax",
          name: "Sync Taxes",
          description: "",
        },
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
        {
          command: "add_product",
          name: "Sync Products",
          description: "",
        },
        {
          command: "sync_inventory",
          name: "Sync Inventory",
          description: "",
        },
        {
          command: "adjust_inventory",
          name: "Adjust Inevntory",
          description: "",
        },
      ],
      app_category: "6249fa8466312f76e595634a",
      createdAt: "2022-04-03T19:56:11.345Z",
      updatedAt: "2022-04-03T21:02:39.881Z",
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
    },
    formData: {
      client: {
        clientHook: true,
      },
      invoices: {
        createInvoiceHook: true,
        createCreditNoteHook: true,
        invoiceInitialStatus: "Approved",
      },
      payments: {
        createPaymentHook: true,
      },
      refunds: {
        createRefundHook: true,
      },
      transfer: {
        createTransferHook: false,
      },
      bench_time_client: "2022-05-18T09:16:00.000Z",
      serviceApiKey: "7397dcfd9a2446277c367acd7",
      repzoApiKey: "DGgdM0ZGLzR8UH25Lu3okxAs-AzArDH6VN0zcsY0Qek",
      paymentAccountId: 17,
      errorEmail: "mohammad.khamis@repzoapp.com",
    },
    company_namespace: ["intgqoyod"],
    createdAt: "2022-05-17T12:39:12.338Z",
    updatedAt: "2022-10-02T09:16:48.901Z",
    __v: 0,
    options_formData: {
      bench_time_category: "2022-10-02T09:16:42.367Z",
      bench_time_tax: "2022-10-02T09:16:43.604Z",
      bench_time_measureunit: "2022-10-02T09:16:44.826Z",
      bench_time_product: "2022-10-02T09:16:46.921Z",
      bench_time_inventory: "2022-10-02T09:16:48.191Z",
      bench_time_disabled_client: "2022-10-02T09:16:41.259Z",
      bench_time_client: "2022-10-02T09:16:38.911Z",
    },
  },
  command: "basic",
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
  meta: "",
  sync_id: "502af0ee-22e1-43d1-aa85-4bcc879ecb16",
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
