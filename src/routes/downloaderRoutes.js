import { scrapeTikTok } from "../scrapers/tiktokScraper.js";
import { scrapeInstagram } from "../scrapers/instagramScraper.js";
import { scrapeFacebook } from "../scrapers/facebookScraper.js";
import { scrapeTwitter } from "../scrapers/twitterScraper.js";

export const downloadVideo = async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "No URL provided" });

  try {
    let data;

    if (url.includes("tiktok.com")) data = await scrapeTikTok(url);
    else if (url.includes("instagram.com")) data = await scrapeInstagram(url);
    else if (url.includes("facebook.com")) data = await scrapeFacebook(url);
    else if (url.includes("x.com") || url.includes("twitter.com"))
      data = await scrapeTwitter(url);
    else
      return res.status(400).json({ error: "Unsupported platform" });

    if (!data || !data.videoUrl)
      return res.status(400).json({ error: "Failed to fetch video" });

    res.json({
      status: "success",
      ...data,
    });
  } catch (err) {
    console.error("❌ Scrape error:", err.message);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch video data",
      details: err.message,
    });
  }
};
