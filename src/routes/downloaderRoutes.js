import express from "express";
import cors from "cors";
import {
  downloadVideo,
  streamDownload,
  proxyDownload,
} from "../controllers/downloaderController.js";

const router = express.Router();

// ✅ Apply CORS to all routes in this router
router.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ✅ Handle preflight requests (important for POST)
router.options("*", cors());

// ✅ Health check route — confirms backend is alive
router.get("/", (req, res) => {
  res.json({ status: "ok", message: "Downloader API running 🚀" });
});

// ✅ Main route — fetches video metadata
router.post("/download", async (req, res) => {
  try {
    await downloadVideo(req, res);
  } catch (err) {
    console.error("❌ Route Error (/download):", err.message);
    res.status(500).json({
      status: "error",
      message: "Internal server error while fetching metadata",
    });
  }
});

// ✅ Stream route — used to directly stream video download
router.get("/stream", async (req, res) => {
  try {
    await streamDownload(req, res);
  } catch (err) {
    console.error("❌ Route Error (/stream):", err.message);
    res.status(500).json({
      status: "error",
      message: "Internal server error while streaming video",
    });
  }
});

// ✅ Proxy download route
router.post("/proxy", async (req, res) => {
  try {
    await proxyDownload(req, res);
  } catch (err) {
    console.error("❌ Route Error (/proxy):", err.message);
    if (!res.headersSent) {
      res.status(500).json({
        status: "error",
        message: "Internal server error while proxy downloading",
        details: err.message
      });
    }
  }
});

export default router;
