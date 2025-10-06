import axios from "axios";
import { identifyPlatform } from "../utils/apiClient.js";

export const downloadVideo = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "No URL provided" });

    const platform = identifyPlatform(url);
    let response;
    let videoUrl = "";

    switch (platform) {
      case "tiktok":
        response = await axios.get(
          `https://tiktok-download-video1.p.rapidapi.com/video?url=${encodeURIComponent(url)}`,
          {
            headers: {
              "X-RapidAPI-Key": process.env.RAPID_API_KEY,
              "X-RapidAPI-Host": "tiktok-download-video1.p.rapidapi.com",
            },
          }
        );
        // TikTok API sometimes nests differently
        videoUrl = response.data?.data?.playUrl || response.data?.playUrl || "";
        break;

      case "instagram":
        response = await axios.get(
          `https://instagram-reels-downloader-api.p.rapidapi.com/download?url=${encodeURIComponent(url)}`,
          {
            headers: {
              "X-RapidAPI-Key": process.env.RAPID_API_KEY,
              "X-RapidAPI-Host": "instagram-reels-downloader-api.p.rapidapi.com",
            },
          }
        );
        // Instagram video URL key may differ
        videoUrl = response.data?.video || response.data?.videoUrl || "";
        break;

      case "facebook":
        response = await axios.post(
          "https://facebook-media-downloader1.p.rapidapi.com/get_media",
          { url },
          {
            headers: {
              "X-RapidAPI-Key": process.env.RAPID_API_KEY,
              "X-RapidAPI-Host": "facebook-media-downloader1.p.rapidapi.com",
              "Content-Type": "application/json",
            },
          }
        );
        videoUrl = response.data?.mediaUrl || response.data?.url || "";
        break;

      default:
        return res.status(400).json({ error: "Unsupported platform" });
    }

    if (!videoUrl) {
      return res.status(404).json({ error: "No video found for this URL" });
    }

    res.json({
      platform,
      status: "success",
      data: { videoUrl },
    });
  } catch (error) {
    console.error("Download error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch video data" });
  }
};
