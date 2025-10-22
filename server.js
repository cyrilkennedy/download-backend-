import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import { chromium } from "playwright"; // ⬅️ NEW: Preload Playwright
import downloaderRoutes from "./src/routes/downloaderRoutes.js";

dotenv.config();
const app = express();

// 🧩 Global browser instance (for efficiency)
let browser;

// 🟢 Initialize Playwright once when server starts
async function initPlaywright() {
  try {
    browser = await chromium.launch({ headless: true });
    console.log("✅ Playwright initialized successfully.");
  } catch (err) {
    console.error("❌ Failed to initialize Playwright:", err.message);
  }
}

// 🧹 Graceful shutdown
process.on("SIGTERM", async () => {
  if (browser) await browser.close();
  process.exit(0);
});

// 🛡️ Security Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: false, // allows images & media to load across origins
  })
);

// ⚡ Compress responses for faster load
app.use(compression());

// 🌍 CORS Setup
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 🧩 Parse JSON
app.use(express.json());

// 🎥 API Routes
app.use("/api", downloaderRoutes);

// 🌐 Root Route
app.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(`
    <h2>📦 Video Downloader Backend Running...</h2>
    <p>Status: ✅ OK</p>
    <p>Environment: ${process.env.NODE_ENV || "development"}</p>
  `);
});

// 🚀 Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`✅ Server running on port ${PORT}`);
  await initPlaywright();
});
