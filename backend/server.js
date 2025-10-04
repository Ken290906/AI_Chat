import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import cors from "cors";
import http from "http";
import { WebSocketServer } from "ws";

dotenv.config();
const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

const API_URL = "http://localhost:11434/api/generate";

// =========================
// ✅ PHẦN CHAT VỚI AI (GỐC GIỮ NGUYÊN)
// =========================
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

    let fullResponse = "";
    for await (const chunk of response.body) {
      const text = chunk.toString();
      try {
        const json = JSON.parse(text);
        if (json.response) fullResponse += json.response;
      } catch {}
    }

    res.json({ reply: fullResponse.trim() });
  } catch (error) {
    console.error("ERROR in /api/chat:", error);
    res.status(500).json({ error: "Error processing chat request." });
  }
});

// =========================
// ✅ WEBSOCKET PHẦN CHAT ADMIN - CLIENT
// =========================
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let adminSocket = null;
const clients = new Map();

wss.on("connection", (ws, req) => {
  console.log("🟢 New WebSocket connection");

  ws.on("message", (raw) => {
    let data;
    try {
      data = JSON.parse(raw.toString());
    } catch {
      console.error("❌ Invalid message:", raw.toString());
      return;
    }

    if (data.type === "admin_register") {
      adminSocket = ws;
      console.log("👨‍💼 Admin connected");
      return;
    }

    if (data.type === "client_register") {
      clients.set(data.clientId, ws);
      console.log(`👤 Client ${data.clientId} connected`);
      return;
    }

    if (data.type === "support_request") {
      if (adminSocket) {
        adminSocket.send(
          JSON.stringify({
            type: "support_request",
            clientId: data.clientId,
            message: "Khách hàng cần hỗ trợ gấp!",
          })
        );
      }
      return;
    }

    if (data.type === "admin_message") {
      const client = clients.get(data.clientId);
      if (client && client.readyState === ws.OPEN) {
        client.send(
          JSON.stringify({
            type: "admin_message",
            message: data.message,
          })
        );
      }
      return;
    }

    if (data.type === "client_message") {
      if (adminSocket) {
        adminSocket.send(
          JSON.stringify({
            type: "client_message",
            clientId: data.clientId,
            message: data.message,
          })
        );
      }
      return;
    }
  });

  ws.on("close", () => {
    console.log("🔴 Connection closed");
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`🚀 Server (Express + WebSocket) running on port ${port}`);
});
