import { chromium } from "playwright";

export async function scrapeTikTok(url) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle" });

  const videoSrc = await page.evaluate(() => {
    const video = document.querySelector("video");
    return video ? video.src : null;
  });

  const title = await page.title();
  const thumbnail = await page.evaluate(() => {
    const img = document.querySelector("img");
    return img ? img.src : null;
  });

  await browser.close();

  return {
    platform: "tiktok",
    title: title || "TikTok Video",
    videoUrl: videoSrc,
    thumbnail,
  };
}
