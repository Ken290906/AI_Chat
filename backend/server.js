import express from "express";
import dotenv from "dotenv";
import db from './models/index.js';
import fetch from "node-fetch";
import cors from "cors";
import http from "http";
import xlsx from "xlsx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Import routes and WebSocket
import nhatKyXuLyRoutes from './routes/nhatkyxuly.js';
import authRoutes from './routes/auth.js'; // THÊM DÒNG NÀY
import { setupWebSocket } from './websocket/websocket.js';

dotenv.config();

// =========================
// ✅ PHẦN ĐỌC MENU TỰ ĐỘNG TỪ FILE EXCEL
// =========================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let menuPrompt = "Hiện tại menu chưa được cập nhật. Vui lòng quay lại sau.";

function loadMenuData() {
  const menuPath = path.resolve(__dirname, '../my-app/src/assets/Menu.xlsx');
  console.log(`Đang tìm kiếm menu tại: ${menuPath}`);

  if (fs.existsSync(menuPath)) {
    try {
      const workbook = xlsx.readFile(menuPath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const menuJson = xlsx.utils.sheet_to_json(worksheet);

      if (menuJson.length > 0) {
        let formattedMenu = "Menu của chúng ta:\n";
        menuJson.forEach(item => {
          const name = item['Tên đồ uống'] || 'Tên không xác định';
          const price = item['Giá'] ? `${item['Giá']}đ` : 'Giá liên hệ';
          const description = item['Mô tả'] || 'Không có mô tả';
          formattedMenu += `- ${name} (${price}): ${description}\n`;
        });
        menuPrompt = formattedMenu;
        console.log("✅ Menu đã được tải và định dạng thành công!");
      } else {
        console.log("⚠️ Tệp Menu.xlsx trống hoặc không có dữ liệu.");
        menuPrompt = "Menu đang được cập nhật. Xin lỗi vì sự bất tiện này.";
      }
    } catch (error) {
      console.error("❌ Lỗi khi đọc hoặc xử lý tệp Menu.xlsx:", error);
      menuPrompt = "Đã có lỗi xảy ra khi tải menu. Vui lòng liên hệ quản trị viên.";
    }
  } else {
    console.log(`❌ Không tìm thấy tệp Menu.xlsx tại đường dẫn: ${menuPath}`);
    menuPrompt = "Không tìm thấy thông tin menu. Vui lòng đảm bảo tệp Menu.xlsx tồn tại.";
  }
}

loadMenuData();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());
app.use('/api', nhatKyXuLyRoutes);
app.use('/api/auth', authRoutes); // THÊM DÒNG NÀY

const API_URL = "http://localhost:11434/api/generate";

// =========================
// ✅ PHẦN CHAT VỚI AI (SỬ DỤNG MENU ĐỘNG)
// =========================
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const systemPrompt = `Bối cảnh: Bạn là một nhân viên tư vấn nhiệt tình và am hiểu của thương hiệu trà sữa "Tâm Trà". Nhiệm vụ của bạn là dựa vào menu dưới đây để giới thiệu, giải đáp thắc mắc và giúp khách hàng chọn được món đồ uống ưng ý nhất. Hãy luôn giữ giọng văn thân thiện, vui vẻ.
\n${menuPrompt}
\nNhiệm vụ: Bây giờ, hãy trả lời câu hỏi của khách hàng dưới đây.
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
// ✅ KHỞI TẠO SERVER VÀ WEBSOCKET
// =========================
const server = http.createServer(app);

// Setup WebSocket
setupWebSocket(server);

// Kết nối database
db.sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connection has been established successfully.');
  })
  .catch(err => {
    console.error('❌ Unable to connect to the database:', err);
  });

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`🚀 Server (Express + WebSocket) running on port ${port}`);
});