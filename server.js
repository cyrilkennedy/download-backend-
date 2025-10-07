import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import downloaderRoutes from "./src/routes/downloaderRoutes.js";

dotenv.config();
const app = express();

// 🛡️ Security Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: false, // allows images & media to load across origins
  })
);

// ⚡ Compress responses for faster load (SEO boost)
app.use(compression());

// 🌍 CORS Setup — allows frontend (React app) to call backend
app.use(
  cors({
    origin: "*", // You can later replace * with your domain for security
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

// 🚀 Server Listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅ Secure server running on port ${PORT}`)
);

// 🧠 Debug Info
console.log("TikTok Host:", process.env.RAPID_TIKTOK_HOST);
console.log("IG Host:", process.env.RAPID_SOCIAL_HOST);
console.log("X Host:", process.env.RAPID_X_HOST);
