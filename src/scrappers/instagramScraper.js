import { chromium } from "playwright";

export async function scrapeInstagram(url) {
  let browser;
  try {
    console.log("🚀 Launching browser for Instagram...");
    
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled'
      ]
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    console.log("📄 Navigating to:", url);
    
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log("⏳ Waiting for video element...");
    await page.waitForSelector('video', { timeout: 15000 });
    
    console.log("🔍 Extracting data...");
    const data = await page.evaluate(() => {
      const video = document.querySelector('video');
      const source = video?.querySelector('source');
      const title = document.querySelector('h1')?.textContent || 
                    document.querySelector('meta[property="og:title"]')?.content ||
                    document.title;
      const thumbnail = document.querySelector('meta[property="og:image"]')?.content;
      
      return {
        videoUrl: video?.src || source?.src || null,
        videoSrcList: Array.from(document.querySelectorAll('video')).map(v => v.src),
        title: title?.trim() || 'Instagram Video',
        thumbnail: thumbnail || '',
        hasVideo: !!video,
        videoAttributes: video ? {
          src: video.src,
          currentSrc: video.currentSrc,
          poster: video.poster
        } : null
      };
    });
    
    console.log("📊 Extracted data:", data);
    await browser.close();
    
    if (!data.videoUrl) {
      throw new Error(`Could not find video URL. Found ${data.videoSrcList.length} video elements. hasVideo: ${data.hasVideo}`);
    }
    
    return {
      platform: "instagram",
      title: data.title,
      videoUrl: data.videoUrl,
      thumbnail: data.thumbnail
    };
    
  } catch (error) {
    if (browser) await browser.close();
    console.error('❌ Instagram scraper error:', error.message);
    throw error;
  }
}