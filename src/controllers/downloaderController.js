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

// 🟢 STEP 2B: Axios-powered download (for CORS-safe fetch)// Backend: controllers/downloadController.js or services/proxyService.js


// 🟢 Axios-powered download (for CORS-safe fetch)
// 🟢 Axios-powered proxy with STREAMING (avoids buffering large files)
export const proxyDownload = async (req, res) => {
  try {
    const { url } = req.body;
    
    // Validate URL
    if (!url || url === '#' || url === '') {
      console.error('❌ Invalid URL received:', url);
      return res.status(400).json({ 
        error: "No valid video URL provided",
        receivedUrl: url 
      });
    }

    console.log('📡 Proxying video from:', url);

    // Fetch video as stream
    const response = await axios.get(url, {
      responseType: "stream",  // ✅ Key change: stream instead of arraybuffer
      headers: { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": new URL(url).origin,
        "Accept": "*/*"  // Add for better compatibility
      },
      timeout: 120000,  // ✅ Increase to 120s for larger videos
      maxRedirects: 5
    });

    console.log('✅ Video stream started, size:', response.headers['content-length'] || 'unknown');

    // Set response headers from source (dynamic Content-Type)
    res.setHeader("Content-Type", response.headers['content-type'] || "video/mp4");
    res.setHeader("Content-Disposition", "attachment; filename=video.mp4");
    if (response.headers['content-length']) {
      res.setHeader("Content-Length", response.headers['content-length']);
    }
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Pipe the stream to response
    response.data.pipe(res);

    // Handle stream errors
    response.data.on('error', (err) => {
      console.error('❌ Stream error:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Stream failed' });
      }
    });

    // Log completion
    res.on('finish', () => {
      console.log('✅ Video stream completed');
    });
    
  } catch (error) {
    console.error("❌ Download error:", error.message);
    
    if (error.response) {
      // Server responded with error
      console.error("❌ Response error:", error.response.status, error.response.statusText);
      return res.status(error.response.status).json({ 
        error: `Failed to fetch video: ${error.response.status}`,
        details: error.message
      });
    } else if (error.request) {
      // Request made but no response
      console.error("❌ No response received");
      return res.status(504).json({ 
        error: "No response from video source",
        details: error.message
      });
    } else if (error.code === 'ECONNABORTED') {
      // Timeout
      console.error("❌ Timeout error");
      return res.status(408).json({ 
        error: "Request timeout - video may be too large",
        details: error.message
      });
    } else {
      // Something else
      console.error("❌ Unknown error:", error);
      return res.status(500).json({ 
        error: "Failed to download video",
        details: error.message
      });
    }
  }
};