import { chromium } from "playwright";

export async function scrapeFacebook(url) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle" });

  const videoSrc = await page.evaluate(() => {
    const video = document.querySelector("video");
    return video ? video.src : null;
  });

  const title = await page.title();
  await browser.close();

  return {
    platform: "facebook",
    title,
    videoUrl: videoSrc,
    thumbnail: "",
  };
}
