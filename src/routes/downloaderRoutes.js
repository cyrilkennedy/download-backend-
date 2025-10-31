import express from "express";
import { downloadVideo, proxyDownload } from "../controllers/downloaderController.js";

const router = express.Router();

// Health
router.get("/", (req, res) => res.json({ status: "ok" }));

// Metadata
router.post("/download", downloadVideo);

// Proxy download
router.post("/proxy", proxyDownload);

export default router;