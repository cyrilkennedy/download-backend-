import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import downloaderRoutes from "./src/routes/downloaderRoutes.js";

dotenv.config();
const app = express();

// ---------- MIDDLEWARE ----------
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
app.use(compression());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "10mb" })); // for large RapidAPI payloads

// ---------- ROUTES ----------
app.use("/api", downloaderRoutes);

// ---------- HEALTH ----------
app.get("/health", (req, res) => res.send("OK"));

// ---------- ROOT ----------
app.get("/", (req, res) => {
  res.send(`
    <h2>Video Downloader Backend</h2>
    <p>Status: OK</p>
    <p>Environment: ${process.env.NODE_ENV || "development"}</p>
  `);
});

// ---------- START ----------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));