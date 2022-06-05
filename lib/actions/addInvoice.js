import axios from "axios";
// var config = ;
export const addInvoice = async (event, options) => {
  try {
    let res = await axios({
      method: "GET",
      url: `${options.serviceEndPoint}/customers`,
      headers: {
        "API-KEY": options.data.serviceApiKey,
      },
      data: event.body,
    });
    console.dir(res === null || res === void 0 ? void 0 : res.data, {
      depth: 3,
    });
    console.log(options.data);
  } catch (e) {
    //@ts-ignore
    throw e;
    console.error(e);
  }
};
/*
    let res = await axios({
      method: "GET",
      url: "https://www.qoyod.com/api/2.0/customers",
      headers: {
        "API-KEY": "920a55e0aed44e5eaff01d776",
      },
      data: {
        name: "test",
        contact_name: "Test Contact",
        organization: "",
        email: "",
        phone_number: "",
        tax_number: "",
        status: "Active",
      },
    });

*/
