const fs = require("fs");
const login = require("fb-chat-api");
const downloader = require("./scripts/events/downloder");

const appStatePath = "./appstate.json";

let appState = null;
if (fs.existsSync(appStatePath)) {
  appState = JSON.parse(fs.readFileSync(appStatePath, "utf8"));
} else {
  console.error("Error: appstate.json not found. Please login and create it.");
  process.exit(1);
}

login({ appState }, (err, api) => {
  if (err) {
    console.error("Login error:", err);
    return;
  }

  // Save updated appState when changed (token refresh etc)
  api.setOptions({ listenEvents: true });
  api.on("appStateChange", (newState) => {
    fs.writeFileSync(appStatePath, JSON.stringify(newState, null, 2));
  });

  api.listen((err, event) => {
    if (err) {
      console.error(err);
      return;
    }
    downloader.onEvent({ api, event });
  });
});
  
