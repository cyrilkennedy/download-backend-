import express from "express";
import { downloadVideo, streamDownload } from "../controllers/downloadController.js";

const router = express.Router();

// Step 1: Get video info (used in Step1Paste.jsx)
router.post("/fetch", downloadVideo);

// Step 2: Force file download through backend
router.get("/download", streamDownload);

export default router;
