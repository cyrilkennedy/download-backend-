import axios from "axios";
import { identifyPlatform } from "../utils/apiClient.js";

export const downloadVideo = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "No URL provided" });

    const platform = identifyPlatform(url);
    let apiURL;
    let response;

    switch (platform) {
      case "tiktok":
        apiURL = `https://tiktok-download-video1.p.rapidapi.com/photoSearch?keywords=${encodeURIComponent(
          "video"
        )}&region=US`;
        response = await axios.get(apiURL, {
          headers: {
            "X-RapidAPI-Key": process.env.RAPID_API_KEY,
            "X-RapidAPI-Host": "tiktok-download-video1.p.rapidapi.com",
          },
        });
        break;

      case "instagram":
      case "facebook":
        apiURL = `https://social-media-video-downloader.p.rapidapi.com/youtube/v3/playlist?playlistId=PL970B66C256FA05E1`;
        response = await axios.get(apiURL, {
          headers: {
            "X-RapidAPI-Key": process.env.RAPID_API_KEY,
            "X-RapidAPI-Host": "social-media-video-downloader.p.rapidapi.com",
          },
        });
        break;

      default:
        return res.status(400).json({ error: "Unsupported platform" });
    }

    res.json({
      platform,
      status: "success",
      data: response.data,
    });
  } catch (error) {
    console.error("Download error:", error.message);
    res.status(500).json({ error: "Failed to fetch video data" });
  }
};
