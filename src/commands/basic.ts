import Repzo from "repzo";
import { EVENT, Config, CommandEvent } from "../types";
import { _fetch, _create, _update, _delete } from "../util.js";

import { commands, commandsList } from "./index.js";
export const basic = async (commandEvent: CommandEvent) => {
  const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
    env: commandEvent.env,
  });

  const commandLog = new Repzo.CommandLog(
    repzo,
    commandEvent.app,
    commandEvent.command
  );
  try {
    console.log("basic sync");

    await commandLog.load(commandEvent.sync_id);
    await commandLog.addDetail("Repzo Qoyod: Basic Sync").commit();

    const required_syncing_commands = [
      "add_client",
      "update_disable_client",
      "add_product",
      "sync_category",
      "sync_tax",
      "sync_measureunit",
      "sync_measureunit_family",
      "sync_inventory",
      "join",
    ];

    for (let i = 0; i < commandsList.length; i++) {
      if (
        commandsList[i].command == "basic" ||
        !required_syncing_commands.includes(commandsList[i].command)
      )
        continue;
      const event: CommandEvent = JSON.parse(JSON.stringify(commandEvent));
      event.command = commandsList[i].command;
      await commandLog
        .addDetail(`Start Syncing: ${commandsList[i].name}`)
        .commit();
      await commands(event);
    }

    await commandLog
      .setStatus("success")
      .setBody("Complete Basic Sync")
      .commit();
  } catch (e: any) {
    //@ts-ignore
    console.error(e?.response?.data);
    await commandLog.setStatus("fail", e).commit();
    throw e?.response;
  }
};
