import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import downloaderRoutes from "./src/routes/downloaderRoutes.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", downloaderRoutes);

app.get("/", (req, res) => {
  res.send("📦 Video Downloader Backend Running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

console.log("TikTok Host:", process.env.RAPID_TIKTOK_HOST);
console.log("IG $:", process.env.RAPID_SOCIAL_HOST);
console.log("X Host:", process.env.RAPID_X_HOST);