import { chromium } from "playwright";

export async function scrapeTwitter(url) {
  let browser;
  try {
    console.log("🚀 Launching browser for Twitter/X...");
    
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
    // Twitter/X uses different selectors
    try {
      await page.waitForSelector('video, [data-testid="videoPlayer"]', { timeout: 15000 });
    } catch (e) {
      console.log("⚠️ Video element not found, trying alternative selectors...");
    }
    
    console.log("🔍 Extracting data...");
    const data = await page.evaluate(() => {
      const video = document.querySelector('video');
      const source = video?.querySelector('source');
      const tweet = document.querySelector('[data-testid="tweet"]');
      const title = tweet?.textContent?.substring(0, 100) || 'Twitter Video';
      
      // Twitter video URLs are often in source elements
      const sources = Array.from(document.querySelectorAll('video source')).map(s => s.src);
      
      return {
        videoUrl: video?.src || source?.src || sources[0] || null,
        videoSrcList: Array.from(document.querySelectorAll('video')).map(v => ({
          src: v.src,
          sources: Array.from(v.querySelectorAll('source')).map(s => s.src)
        })),
        title: title?.trim() || 'Twitter Video',
        thumbnail: '',
        hasVideo: !!video,
        videoAttributes: video ? {
          src: video.src,
          currentSrc: video.currentSrc,
          poster: video.poster,
          sourcesCount: sources.length
        } : null,
        allSources: sources
      };
    });
    
    console.log("📊 Extracted data:", data);
    await browser.close();
    
    if (!data.videoUrl) {
      throw new Error(`Could not find video URL. Found ${data.videoSrcList.length} video elements. All sources: ${data.allSources.join(', ')}`);
    }
    
    return {
      platform: "twitter",
      title: data.title,
      videoUrl: data.videoUrl,
      thumbnail: data.thumbnail
    };
    
  } catch (error) {
    if (browser) await browser.close();
    console.error('❌ Twitter scraper error:', error.message);
    throw error;
  }
}

