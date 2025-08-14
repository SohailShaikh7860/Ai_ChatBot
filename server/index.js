import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();

app.use(cors()); // ✅ Allow requests from other origins
app.use(express.json({ limit: '50mb' })); // Increase limit for large image uploads
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Handle URL-encoded data

// Test endpoint
app.get("/", (req, res) => {
  res.json({ message: "AI ChatBot Server is running!", status: "OK" });
});

app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    const fileData = req.body.file;
    console.log("API Key loaded:", process.env.API_KEY ? "Yes" : "No");
    console.log("User message:", userMessage);
    console.log("File data:", fileData ? "Present" : "None");

    if (!userMessage && !fileData) {
      return res.status(400).json({ error: "No message or file provided" });
    }

    // Validate file size (base64 data can be large)
    if (fileData && fileData.data) {
      const fileSizeInBytes = Math.ceil((fileData.data.length * 3) / 4);
      const fileSizeInMB = fileSizeInBytes / (1024 * 1024);
      
      if (fileSizeInMB > 20) { // Limit to 20MB
        return res.status(400).json({ 
          error: "File too large. Maximum size is 20MB.",
          fileSize: `${fileSizeInMB.toFixed(2)}MB`
        });
      }
      
      console.log(`File size: ${fileSizeInMB.toFixed(2)}MB`);
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: userMessage || "Please analyze this image" },
                ...(fileData ? [{ inline_data: fileData }] : [])
              ]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Gemini API error:", response.status, errorData);
      return res.status(response.status).json({ 
        error: `Gemini API error: ${response.status}`,
        details: errorData
      });
    }

    const data = await response.json();
    console.log("Gemini API response status:", response.status);
    console.log("Response data keys:", Object.keys(data));
    
    res.json(data);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Error processing request", details: error.message });
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));