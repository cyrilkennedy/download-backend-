import axios from "axios";

export async function scrapeTwitter(url) {
  try {
    const response = await axios.get(url);
    const match = response.data.match(/https:\/\/video.twimg.com\/[^"]+/);
    return {
      platform: "twitter",
      title: "Twitter Video",
      videoUrl: match ? match[0] : null,
      thumbnail: "",
    };
  } catch (err) {
    return { error: "Failed to scrape Twitter video" };
  }
}
