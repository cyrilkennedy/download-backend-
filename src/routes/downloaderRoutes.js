import express from "express";
import { downloadVideo } from "../controllers/downloaderController.js";

const router = express.Router();

// ✅ Test route — check if backend is alive
router.get("/", (req, res) => {
  res.json({ status: "ok", message: "Downloader API running 🚀" });
});

// ✅ Main route — handles POST from frontend
router.post("/download", async (req, res) => {
  try {
    await downloadVideo(req, res);
  } catch (err) {
    console.error("❌ Route Error:", err.message);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

export default router;
