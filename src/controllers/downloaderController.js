import axios from "axios";
import https from "https";

// 🔹 Helper: detect platform
const identifyPlatform = (url) => {
  if (url.includes("tiktok.com")) return "tiktok";
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("facebook.com")) return "facebook";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("x.com") || url.includes("twitter.com")) return "twitter";
  return "unknown";
};

// 🟢 STEP 1: Fetch metadata (RapidAPI)
export const downloadVideo = async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "No URL provided" });

  const options = {
    method: "POST",
    url: "https://social-download-all-in-one.p.rapidapi.com/v1/social/autolink",
    headers: {
      "Content-Type": "application/json",
      "X-RapidAPI-Key": "189810ce00mshba6d43848bf048fp11956ejsn61d09e6b2c7b",
      "X-RapidAPI-Host": "social-download-all-in-one.p.rapidapi.com",
    },
    data: { url },
  };

  try {
    const response = await axios.request(options);
    const data = response.data;

    if (data.error) {
      return res.status(400).json({
        status: "error",
        message: "Failed to fetch video data. Try another link.",
      });
    }

    const title = data.title || "video";
    const videoUrl =
      data.medias?.find((m) => m.type === "video")?.url ||
      data.medias?.[0]?.url;

    res.json({
      status: "success",
      platform: identifyPlatform(url),
      title,
      thumbnail: data.thumbnail || data.medias?.[0]?.thumbnail || "",
      videoUrl,
    });
  } catch (error) {
    console.error("❌ Fetch Error:", error.response?.data || error.message);
    res.status(500).json({
      status: "error",
      message: "Internal server error while fetching video info.",
      details: error.response?.data || error.message,
    });
  }
};

// 🟢 STEP 2A: Stream video (works in browser)
export const streamDownload = async (req, res) => {
  const { videoUrl, title = "video" } = req.query;
  if (!videoUrl)
    return res.status(400).json({ error: "No video URL provided" });

  try {
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${title.replace(/[^\w\s]/gi, "")}.mp4"`
    );
    res.setHeader("Content-Type", "video/mp4");

    https.get(videoUrl, (stream) => stream.pipe(res));
  } catch (err) {
    console.error("❌ Stream Error:", err);
    res.status(500).json({ error: "Failed to stream video for download" });
  }
};

// 🟢 STEP 2B: Axios-powered download (for CORS-safe fetch)
export const proxyDownload = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "No video URL provided" });

    const response = await axios.get(url, {
      responseType: "arraybuffer",
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=tiktok_video.mp4"
    );
    res.send(response.data);
  } catch (error) {
    console.error("Download error:", error.message);
    res.status(500).json({ error: "Failed to download video" });
  }
};
