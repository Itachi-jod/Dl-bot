const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  onEvent: async function({ api, event }) {
    const message = event.body;
    if (!message) return;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = message.match(urlRegex);
    if (!urls) return;

    const url = urls[0];

    try {
      const res = await axios({
        url,
        method: "GET",
        responseType: "stream"
      });

      const tempPath = path.join(__dirname, "video.mp4");
      const writer = fs.createWriteStream(tempPath);
      res.data.pipe(writer);

      writer.on("finish", () => {
        api.sendMessage({
          attachment: fs.createReadStream(tempPath)
        }, event.threadID, () => fs.unlinkSync(tempPath), event.messageID);
      });

      writer.on("error", (err) => {
        console.error(err);
        fs.unlinkSync(tempPath);
      });

    } catch (e) {
      console.log(e);
    }
  }
};
  
