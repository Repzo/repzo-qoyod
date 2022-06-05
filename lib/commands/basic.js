import Repzo from "repzo";
import { commands, commandsList } from "./index.js";
export const basic = async (commandEvent) => {
  var _a, _b;
  const repzo = new Repzo(
    (_a = commandEvent.app.formData) === null || _a === void 0
      ? void 0
      : _a.repzoApiKey,
    {
      env: commandEvent.env,
    }
  );
  const commandLog = new Repzo.CommandLog(
    repzo,
    commandEvent.app,
    commandEvent.command
  );
  try {
    console.log("basic sync");
    await commandLog.load(commandEvent.sync_id);
    await commandLog.addDetail("Repzo Qoyod: Basic Sync").commit();
    for (let i = 0; i < commandsList.length; i++) {
      if (commandsList[i].command == "basic") continue;
      const event = JSON.parse(JSON.stringify(commandEvent));
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
  } catch (e) {
    //@ts-ignore
    console.error(
      (_b = e === null || e === void 0 ? void 0 : e.response) === null ||
        _b === void 0
        ? void 0
        : _b.data
    );
    await commandLog.setStatus("fail", e).commit();
    throw e === null || e === void 0 ? void 0 : e.response;
  }
};
