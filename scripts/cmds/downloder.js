const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { parse } = require("url");

module.exports = {
  onEvent: async function({ api, event }) {
    try {
      if (event.type !== "message" || !event.body) return;

      const text = event.body;
      const urlMatch = text.match(/https?:\/\/[^\s]+/);
      if (!urlMatch) return;

      const url = urlMatch[0];
      const hostname = parse(url).hostname || "";

      let platform = "Unknown";
      if (hostname.includes("tiktok")) platform = "TikTok";
      else if (hostname.includes("instagram")) platform = "Instagram";
      else if (hostname.includes("facebook")) platform = "Facebook";
      else if (hostname.includes("youtube") || hostname.includes("youtu.be")) platform = "YouTube";
      else if (hostname.includes("x.com") || hostname.includes("twitter")) platform = "Twitter";

      const apiUrl = `https://dev-priyanshi.onrender.com/api/alldl?url=${encodeURIComponent(url)}`;

      // React with ⏳ while processing
      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      const res = await axios.get(apiUrl, { timeout: 30000 });
      const videoUrl = res.data?.data?.low;

      if (!videoUrl || !videoUrl.startsWith("http")) {
        console.log("❌ No valid video URL found.");
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return;
      }

      const response = await axios({
        method: "GET",
        url: videoUrl,
        responseType: "stream",
        timeout: 60000,
      });

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

      const filePath = path.join(cacheDir, `video_${Date.now()}.mp4`);
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      const fileSizeMB = fs.statSync(filePath).size / (1024 * 1024);
      if (fileSizeMB > 100) {
        fs.unlinkSync(filePath);
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return api.sendMessage(
          "❌ The video is too large to send (over 100MB).",
          event.threadID,
          event.messageID
        );
      }

      await api.sendMessage(
        {
          body: `Here's your downloaded video!\n\nPlatform: ${platform}`,
          attachment: fs.createReadStream(filePath),
        },
        event.threadID,
        (err) => {
          fs.unlinkSync(filePath);
          if (err) {
            console.error("Send Message Error:", err.message);
            api.setMessageReaction("❌", event.messageID, () => {}, true);
            return api.sendMessage(
              "❌ Failed to send the video.",
              event.threadID,
              event.messageID
            );
          }

          // Success react ✅
          api.setMessageReaction("✅", event.messageID, () => {}, true);
        },
        event.messageID
      );

    } catch (err) {
      console.error("Downloader Error:", err.message);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  }
};
