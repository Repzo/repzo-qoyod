import axios from "axios";
import Repzo from "repzo";
import { EVENT, Config, CommandEvent } from "../types";

// var config = ;
export const addClients = async (commandEvent: CommandEvent) => {
  try {
    let res = await axios({
      method: "GET",
      url: `${commandEvent.app.available_app.app_settings.serviceEndPoint}/customers`,
      headers: {
        "API-KEY": commandEvent.app.formData.serviceApiKey
      }
    });

    console.dir(res?.data, { depth: 3 });
    console.log(commandEvent);
    const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey);
    let clients = await repzo.client.find({ name: "" });
    clients.data[0].name;
    return res?.data;
  } catch (e) {
    //@ts-ignore
    throw e;
    console.error(e);
  }
};
