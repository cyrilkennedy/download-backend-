import axios from "axios";
import { identifyPlatform } from "../utils/apiClient.js";

export const downloadVideo = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "No URL provided" });

    const platform = identifyPlatform(url);
    let apiURL;
    let response;
    let videoUrl = "";

    switch (platform) {
      case "tiktok":
        apiURL = `https://tiktok-download-video1.p.rapidapi.com/video?url=${encodeURIComponent(
          url
        )}`;
        response = await axios.get(apiURL, {
          headers: {
            "X-RapidAPI-Key": process.env.RAPID_API_KEY,
            "X-RapidAPI-Host": "tiktok-download-video1.p.rapidapi.com",
          },
        });
        videoUrl = response.data?.data?.playUrl || ""; // Extract video URL
        break;

      case "instagram":
        apiURL = `https://instagram-reels-downloader-api.p.rapidapi.com/download?url=${encodeURIComponent(
          url
        )}`;
        response = await axios.get(apiURL, {
          headers: {
            "X-RapidAPI-Key": process.env.RAPID_API_KEY,
            "X-RapidAPI-Host": "instagram-reels-downloader-api.p.rapidapi.com",
          },
        });
        videoUrl = response.data?.videoUrl || "";
        break;

      case "facebook":
        apiURL = `https://facebook-media-downloader1.p.rapidapi.com/get_media`;
        response = await axios.post(
          apiURL,
          { url },
          {
            headers: {
              "X-RapidAPI-Key": process.env.RAPID_API_KEY,
              "X-RapidAPI-Host": "facebook-media-downloader1.p.rapidapi.com",
              "Content-Type": "application/json",
            },
          }
        );
        videoUrl = response.data?.mediaUrl || "";
        break;

      default:
        return res.status(400).json({ error: "Unsupported platform" });
    }

    if (!videoUrl) return res.status(500).json({ error: "No video found" });

    res.json({
      platform,
      status: "success",
      data: { videoUrl },
    });
  } catch (error) {
    console.error("Download error:", error.message);
    res.status(500).json({ error: "Failed to fetch video data" });
  }
};
