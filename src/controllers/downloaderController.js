import { scrapeTikTok } from "../scrappers/tiktokScraper.js";
import { scrapeInstagram } from "../scrappers/instagramScraper.js";
import { scrapeFacebook } from "../scrappers/facebookScraper.js";
import { scrapeTwitter } from "../scrappers/twitterScraper.js";

const downloaderRoutes = async (req, res) => {
  let { url } = req.body;
  
  console.log("📥 Received request:", { url, body: req.body });
  
  if (!url) {
    console.log("❌ No URL provided");
    return res.status(400).json({ 
      error: "No URL provided",
      receivedBody: req.body 
    });
  }

  // Basic normalization: trim and ensure protocol is present for URL parsing
  url = String(url).trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  // Validate URL format
  try {
    // will throw if invalid
    new URL(url);
  } catch (e) {
    console.log("❌ Invalid URL provided:", url);
    return res.status(400).json({
      error: "Invalid URL",
      provided: req.body.url
    });
  }

  try {
    let data;
    let platform = "unknown";

    const u = url.toLowerCase();

    // detect common domain variations as well
    if (u.includes("tiktok.com") || u.includes("vm.tiktok.com")) {
      platform = "tiktok";
      console.log("🎵 Scraping TikTok:", url);
      data = await scrapeTikTok(url);
    } else if (u.includes("instagram.com") || u.includes("instagr.am")) {
      platform = "instagram";
      console.log("📸 Scraping Instagram:", url);
      data = await scrapeInstagram(url);
    } else if (u.includes("facebook.com") || u.includes("fb.watch")) {
      platform = "facebook";
      console.log("👥 Scraping Facebook:", url);
      data = await scrapeFacebook(url);
    } else if (u.includes("x.com") || u.includes("twitter.com")) {
      platform = "twitter";
      console.log("🐦 Scraping Twitter/X:", url);
      data = await scrapeTwitter(url);
    } else {
      console.log("❌ Unsupported platform:", url);
      return res.status(400).json({ 
        error: "Unsupported platform",
        url: url,
        supportedPlatforms: ["tiktok.com", "vm.tiktok.com", "instagram.com", "facebook.com", "fb.watch", "twitter.com", "x.com"]
      });
    }

    console.log("✅ Scraping result:", data);

    if (!data || !data.videoUrl) {
      console.log("❌ No video URL found in data:", data);
      return res.status(502).json({ 
        error: "Failed to fetch video",
        platform: platform,
        details: "Video URL not found in scraped data",
        scrapedData: data
      });
    }

    console.log("🎉 Success! Returning data");
    return res.json({
      status: "success",
      ...data,
    });
    
  } catch (err) {
    console.error("❌ Scrape error:", err);

    // Detect common Playwright/puppeteer timeout messages and return actionable info
    const msg = err && err.message ? String(err.message) : "";
    const isTimeout = /page\.waitForSelector: Timeout|Timeout.*exceeded|waiting for locator\('video'\)/i.test(msg);

    if (isTimeout) {
      // Timeout waiting for 'video' element — likely causes:
      // - site structure changed and selector no longer matches
      // - content is loaded via JS after additional interaction (cookies/modal/consent)
      // - bot detection / rate limiting or the page never fully loads
      // - scraper timeout is too short for this site
      return res.status(504).json({
        status: "error",
        error: "Scraper timeout while waiting for page elements",
        message: msg,
        platform: (() => {
          try {
            const parsed = new URL(url);
            return parsed.hostname;
          } catch (_) {
            return "unknown";
          }
        })(),
        suggestions: [
          "Check that the target page still contains a <video> element or update the selector in the scraper.",
          "Increase the wait/timeout value inside the scraper (playwright/puppeteer waitForSelector timeout).",
          "Handle cookie consent or interstitials that block the video element (the scraper may need to accept/populate cookies).",
          "Try running the scraper headful / with slower network or add retries to detect transient issues.",
          "Ensure the request URL is reachable and not blocked by bot protections (Cloudflare, etc.)."
        ],
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined
      });
    }

    // Fallback generic error
    return res.status(500).json({
      status: "error",
      error: "Failed to fetch video data",
      message: msg || "Unknown error",
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
  }
};

export default downloaderRoutes;