const fs = require("fs");
const login = require("fb-chat-api");
const downloader = require("./scripts/cmds/downloder");

const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Bot is running!");
});

app.listen(PORT, () => {
  console.log(`✅ Web server running on port ${PORT}`);
});

// Your existing bot code below


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

  process.on("exit", () => {
    fs.writeFileSync(appStatePath, JSON.stringify(api.getAppState(), null, 2));
    console.log("💾 appState saved on exit.");
  });

  api.listenMqtt((err, event) => {
    if (err) {
      console.error(err);
      return;
    }

    downloader.onEvent({ api, event });
  });
});

