import { chromium } from "playwright";

export async function scrapeFacebook(url) {
  let browser;
  try {
    console.log("🚀 Launching browser for Facebook...");
    
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
    
    // Use a slightly more lenient navigation wait and larger timeout
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    console.log("⏳ Waiting for video element or fallback metadata...");
    // Wait for either a <video> to be attached or for OG meta tags to appear.
    // Check 'attached' state because video elements might be in the DOM but not yet visible.
    const waitForVideoOrMeta = Promise.race([
      page.waitForSelector('video', { state: 'attached', timeout: 30000 }).catch(() => null),
      page.waitForSelector('meta[property="og:video"], meta[property="og:video:url"], meta[property="og:image"]', { state: 'attached', timeout: 30000 }).catch(() => null)
    ]);
    await waitForVideoOrMeta;
    
    console.log("🔍 Extracting data (robust extraction with fallbacks)...");
    const data = await page.evaluate(() => {
      const getMeta = (prop) => document.querySelector(`meta[property="${prop}"], meta[name="${prop}"]`)?.content;
      const video = document.querySelector('video');
      const source = video?.querySelector('source');
      const title = document.querySelector('h1')?.textContent ||
                    getMeta('og:title') ||
                    document.title;
      const thumbnail = getMeta('og:image') || '';
      // Try common OG video meta fields
      const ogVideo = getMeta('og:video') || getMeta('og:video:url') || getMeta('og:video:secure_url');

      // Facebook sometimes stores playable URLs inside inline JSON in script tags.
      const scripts = Array.from(document.querySelectorAll('script')).map(s => s.textContent).filter(Boolean);
      let parsedPlayable = {};
      for (const text of scripts) {
        try {
          // look for JSON-like keys commonly used: playable_url, playable_url_quality_hd, playable_url_quality_sd
          if (text.includes('playable_url')) {
            const hdMatch = text.match(/"playable_url_quality_hd"\s*:\s*"([^"]+)"/);
            const sdMatch = text.match(/"playable_url_quality_sd"\s*:\s*"([^"]+)"/);
            const baseMatch = text.match(/"playable_url"\s*:\s*"([^"]+)"/);
            if (hdMatch && hdMatch[1]) parsedPlayable.hd = hdMatch[1].replace(/\\\//g, '/').replace(/\\u0025/g, '%');
            if (sdMatch && sdMatch[1]) parsedPlayable.sd = sdMatch[1].replace(/\\\//g, '/').replace(/\\u0025/g, '%');
            if (baseMatch && baseMatch[1]) parsedPlayable.base = baseMatch[1].replace(/\\\//g, '/').replace(/\\u0025/g, '%');
          }
        } catch (e) {
          // ignore any parsing errors from script content
        }
      }

      // Facebook sometimes stores video URL in data attributes
      const videoHDAttr = video?.getAttribute('data-hd-src');
      const videoSDAttr = video?.getAttribute('data-sd-src');

      const videoUrlCandidates = [
        ogVideo,
        videoHDAttr,
        parsedPlayable.hd,
        videoSDAttr,
        parsedPlayable.sd,
        parsedPlayable.base,
        video?.src,
        source?.src
      ].filter(Boolean);

      return {
        videoUrl: videoUrlCandidates.length ? videoUrlCandidates[0] : null,
        videoSrcList: Array.from(document.querySelectorAll('video')).map(v => ({
          src: v.src || null,
          hdSrc: v.getAttribute('data-hd-src') || null,
          sdSrc: v.getAttribute('data-sd-src') || null
        })),
        title: title?.trim() || 'Facebook Video',
        thumbnail: thumbnail || '',
        hasVideo: !!video,
        videoAttributes: video ? {
          src: video.src,
          currentSrc: video.currentSrc,
          poster: video.poster,
          hdSrc: videoHDAttr || parsedPlayable.hd || null,
          sdSrc: videoSDAttr || parsedPlayable.sd || null
        } : null
      };
    });
    
    console.log("📊 Extracted data:", data);
    await browser.close();
    
    if (!data.videoUrl) {
      throw new Error(`Could not find video URL. Found ${data.videoSrcList.length} video elements. hasVideo: ${data.hasVideo}; try increasing timeouts or check if the post requires login.`);
    }
    
    return {
      platform: "facebook",
      title: data.title,
      videoUrl: data.videoUrl,
      thumbnail: data.thumbnail
    };
    
  } catch (error) {
    if (browser) await browser.close();
    console.error('❌ Facebook scraper error:', error.message);
    throw error;
  }
}