import axios from "axios";

// ---------- PLATFORM DETECTOR ----------
const identifyPlatform = (url) => {
  if (url.includes("tiktok.com")) return "tiktok";
  if (url.includes("instagram.com") || url.includes("fbcdn.net")) return "instagram";
  if (url.includes("facebook.com")) return "facebook";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("x.com") || url.includes("twitter.com")) return "twitter";
  return "unknown";
};

// ---------- 1. METADATA (RapidAPI) ----------
export const downloadVideo = async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "No URL provided" });

  const options = {
    method: "POST",
    url: "https://social-download-all-in-one.p.rapidapi.com/v1/social/autolink",
    headers: {
      "Content-Type": "application/json",
      "X-RapidAPI-Key": process.env.RAPIDAPI_KEY, // <-- use .env
      "X-RapidAPI-Host": "social-download-all-in-one.p.rapidapi.com",
    },
    data: { url },
  };

  try {
    const { data } = await axios.request(options);
    if (data.error) throw new Error(data.message || "API error");

    const videoUrl = data.medias?.find(m => m.type === "video")?.url || data.medias?.[0]?.url;

    res.json({
      status: "success",
      platform: identifyPlatform(url),
      title: data.title || "video",
      thumbnail: data.thumbnail || data.medias?.[0]?.thumbnail || "",
      videoUrl,
    });
  } catch (err) {
    console.error("Metadata error:", err.message);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch video info",
      details: err.message,
    });
  }
};

// ---------- 2. PROXY DOWNLOAD (STREAMING) ----------
export const proxyDownload = async (req, res) => {
  const { url } = req.body;
  if (!url || url === "#" || url === "") {
    return res.status(400).json({ error: "Invalid URL" });
  }

  const MAX_RETRIES = 3;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    attempt++;
    try {
      console.log(`[Attempt ${attempt}] Proxying: ${url}`);

      const response = await axios({
        method: "GET",
        url,
        responseType: "stream",
        timeout: 120000,
        maxRedirects: 10,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
          "Referer": new URL(url).origin,
          "Origin": new URL(url).origin,
          "Accept": "video/mp4,video/*;q=0.9,*/*;q=0.8",
          "Accept-Encoding": "gzip, deflate, br",
          "Connection": "keep-alive",
        },
      });

      // Set headers
      const contentType = response.headers["content-type"] || "video/mp4";
      const contentLength = response.headers["content-length"];

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", 'attachment; filename="video.mp4"');
      res.setHeader("Access-Control-Allow-Origin", "*");
      if (contentLength) res.setHeader("Content-Length", contentLength);

      // Pipe stream
      response.data.pipe(res);

      response.data.on("error", (err) => {
        console.error("Stream error:", err.message);
        if (!res.headersSent) res.status(500).json({ error: "Stream failed" });
      });

      res.on("finish", () => console.log("Stream completed"));
      return;

    } catch (err) {
      console.error(`Attempt ${attempt} failed:`, err.message);

      if (attempt === MAX_RETRIES) {
        const status = err.response?.status || 504;
        return res.status(status).json({
          error: "No response from video source",
          details: err.message,
        });
      }

      // Wait 1.5s before retry
      await new Promise(r => setTimeout(r, 1500));
    }
  }
};