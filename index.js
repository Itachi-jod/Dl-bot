const login = require("fca-unofficial-thanhbao");
const fs = require("fs");
const downloader = require("./scripts/events/downloader");

login({ appState: JSON.parse(fs.readFileSync("appstate.json", "utf8")) }, (err, api) => {
  if (err) return console.error(err);

  api.setOptions({ listenEvents: true });

  api.listenMqtt((err, event) => {
    if (err) return console.error(err);
    if (event.type === "message" || event.type === "message_reply") {
      downloader.onEvent({ api, event });
    }
  });
});
      
