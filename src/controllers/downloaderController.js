import axios from "axios";

export const downloadVideo = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "No URL provided" });

    const apiURL = "https://social-download-all-in-one.p.rapidapi.com/v1/social/autolink";

    const response = await axios.post(
      apiURL,
      { url },
      {
        headers: {
          "X-RapidAPI-Key": process.env.RAPID_API_KEY,
          "X-RapidAPI-Host": "social-download-all-in-one.p.rapidapi.com",
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.data || !response.data.data) {
      return res.status(500).json({ error: "No video found" });
    }

    // Return the video info directly
    res.json({
      platform: response.data.platform || "unknown",
      status: response.data.status || "success",
      data: response.data.data,
    });
 } catch (error) {
  console.error("Download error details:", {
    message: error.message,
    status: error.response?.status,
    data: error.response?.data,
  });
  res.status(500).json({ error: "Failed to fetch video data" });
}

};
