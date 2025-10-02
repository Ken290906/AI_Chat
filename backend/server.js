import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import cors from "cors";

dotenv.config();
const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const API_URL = "http://localhost:11434/api/generate";

// const HF_TOKEN = process.env.HF_TOKEN;

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    console.log("Sending direct fetch request to Ollama API...");

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemma3:4b",
        prompt: message,
      }),
    });

    // Ollama trả về stream -> mình gom lại
    let fullResponse = "";
    for await (const chunk of response.body) {
      const text = chunk.toString();
      try {
        const json = JSON.parse(text);
        if (json.response) fullResponse += json.response;
      } catch (e) {
        // bỏ qua mảnh stream không parse được
      }
    }

    // The response for text-generation is an array, we take the first element
    res.json({
      reply: fullResponse.trim(),
    });
  } catch (error) {
    console.error("ERROR in /api/chat:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing the chat request." });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
