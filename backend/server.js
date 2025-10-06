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

    const systemPrompt = `Bối cảnh: Bạn là một nhân viên tư vấn nhiệt tình và am hiểu của thương hiệu trà sữa "The Alley". Nhiệm vụ của bạn là dựa vào menu dưới đây để giới thiệu, giải đáp thắc mắc và giúp khách hàng chọn được món đồ uống ưng ý nhất. Hãy luôn giữ giọng văn thân thiện, vui vẻ.

Menu của chúng ta:
- Sữa tươi trân châu đường đen: Best seller! Vị sữa tươi thanh mát, béo ngậy từ Đà Lạt kết hợp với trân châu đường đen được nấu trong 2 tiếng, tạo nên hương vị ngọt thơm, dai mềm khó cưỡng.
- Trà sữa Oolong nướng: Hương trà Oolong đậm vị, được "nướng" nhẹ qua lửa để dậy lên mùi caramen độc đáo. Phù hợp cho những ai thích vị trà đậm, hậu vị ngọt ngào.
- Trà xanh Chanh dây: Một sự kết hợp sảng khoái giữa vị trà xanh thanh mát và chanh dây chua ngọt, kèm theo hạt chia giòn giòn. Rất phù hợp cho ngày hè nóng nực.
- Trà sữa Socola Trân châu: Vị socola Bỉ đậm đà, ngọt ngào hòa quyện cùng sữa và trân châu dai giòn. Món quà cho các tín đồ hảo ngọt.

Nhiệm vụ: Bây giờ, hãy trả lời câu hỏi của khách hàng dưới đây.
---
Khách hàng: "${message}"`;

    console.log("Sending prompt-engineered request to Ollama API...");

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemma3:4b",
        prompt: systemPrompt,
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

    if (data.type === "admin_accept_request") {
      const client = clients.get(data.clientId);
      if (client && client.readyState === ws.OPEN) {
        client.send(JSON.stringify({ type: "agent_accepted" }));
        console.log(`✅ Admin accepted support for ${data.clientId}`);
      }
      return;
    }

    if (data.type === "admin_decline_request") {
      const client = clients.get(data.clientId);
      if (client && client.readyState === ws.OPEN) {
        client.send(JSON.stringify({
          type: "agent_declined",
          message: "⚠️ Rất tiếc, hiện tại các nhân viên đều đang bận. Vui lòng thử lại sau ít phút.",
        }));
        console.log(`❌ Admin declined support for ${data.clientId}`);
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
