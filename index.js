const fs = require("fs");
const login = require("fb-chat-api");
const downloader = require("./scripts/cmds/downloder");

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

  console.log("✅ Bot logged in successfully.");

  // Save updated appState on exit for safety
  process.on("exit", () => {
    fs.writeFileSync(appStatePath, JSON.stringify(api.getAppState(), null, 2));
    console.log("💾 appState saved on exit.");
  });

  // Listen for incoming messages
  api.listenMqtt((err, event) => {
    if (err) {
      console.error(err);
      return;
    }

    // Pass api and event to downloader
    downloader.onEvent({ api, event });
  });
});
             
