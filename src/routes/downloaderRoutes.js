import express from "express";
import {
  downloadVideo,
  streamDownload,
  proxyDownload,
} from "../controllers/downloaderController.js";

const router = express.Router();

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

// ✅ Proxy route — safely downloads the video via backend (fixes CORS)
router.post("/proxy", async (req, res) => {
  try {
    await proxyDownload(req, res);
  } catch (err) {
    console.error("❌ Route Error (/proxy):", err.message);
    res.status(500).json({
      status: "error",
      message: "Internal server error while proxy downloading",
    });
  }
});

export default router;
