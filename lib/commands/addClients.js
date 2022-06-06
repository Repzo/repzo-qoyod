import axios from "axios";
// var config = ;
export const addClients = async (commandEvent) => {
  try {
    let res = await axios({
      method: "GET",
      url: `${commandEvent.app.available_app.app_settings.serviceEndPoint}/customers`,
      headers: {
        "API-KEY": commandEvent.app.formData.serviceApiKey,
      },
    });
    // console.dir(res?.data, { depth: 3 });
    // console.log(commandEvent);
    if (Math.random() > 0.75) throw "Custom error for testing";
    return res === null || res === void 0 ? void 0 : res.data;
  } catch (e) {
    //@ts-ignore
    throw e;
    console.error(e);
  }
};
