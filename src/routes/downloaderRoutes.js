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

// ✅ Optional: this is safe now
router.options("/*", cors());

// ✅ Health check route
router.get("/", (req, res) => {
  res.json({ status: "ok", message: "Downloader API running 🚀" });
});
