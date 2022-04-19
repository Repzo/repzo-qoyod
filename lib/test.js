let commandEvent = {
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
                properties: [Object]
            },
            app_settings: {
                repo: "",
                serviceEndPoint: "https://www.qoyod.com/api/2.0",
                meta: {}
            },
            app_category: "6249fa8466312f76e595634a",
            UISchema: {}
        },
        formData: {
            client: { clientHook: true },
            invoices: { createInvoiceHook: true },
            serviceApiKey: "6a0226eb2f2fabdffbffd9b22",
            repzoApiKey: "shQbkfYx8YEJ0T6Co_iYjtynqA5izeEKOc70vUUD8Is",
            errorEmail: "mohammad.khamis@repzoapp.com"
        },
        company_namespace: ["demosv"]
    },
    command: "add_client",
    end_of_day: "04:00",
    nameSpace: ["demosv"],
    timezone: "Asia/Amman",
    meta: '{\r\n    "test":"hi"\r\n}',
    sync_id: undefined,
    env: "staging" // ""staging|production""
};
import { Commands } from "./index.js";
Commands(commandEvent);
