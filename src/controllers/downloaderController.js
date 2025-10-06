import axios from "axios";

// Auto-detect platform
const identifyPlatform = (url) => {
  if (url.includes("tiktok.com")) return "tiktok";
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("facebook.com")) return "facebook";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("x.com") || url.includes("twitter.com")) return "twitter";
  return "unknown";
};

export const downloadVideo = async (req, res) => {
  const { url } = req.body;

  if (!url) return res.status(400).json({ error: "No URL provided" });

  const platform = identifyPlatform(url);

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

    // Extract clean info
    const title = data.title || "Untitled";
    const thumbnail =
      data.thumbnail ||
      data.medias?.[0]?.thumbnail ||
      data.medias?.[0]?.url ||
      "";
    const videoUrl =
      data.medias?.find((m) => m.type === "video")?.url ||
      data.medias?.[0]?.url ||
      "";

    res.json({
      status: "success",
      platform,
      title,
      thumbnail,
      videoUrl,
    });
  } catch (error) {
    console.error("❌ API Error:", error.response?.data || error.message);

    res.status(500).json({
      status: "error",
      message: "Internal Server Error. Please try again later.",
      details: error.response?.data || error.message,
    });
  }
};
