import express from "express";
import { downloadVideo } from "../controllers/downloaderController.js";

const router = express.Router();

// 🧪 Test route
router.get("/", (req, res) => {
  res.json({ message: "Downloader API working 🚀" });
});

// 🎥 Main download route
router.post("/download", downloadVideo);

export default router;