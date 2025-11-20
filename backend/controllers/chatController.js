// file: chatController.js
import fetch from "node-fetch";
import ChatService from "../services/chatService.js";
import { menuPrompt } from "../server.js";

// Import hàm thông báo admin MỚI từ websocket.js
import { notifyAdmin } from "../websocket/websocket.js"; // Sửa đường dẫn nếu cần

export const chatWithAI = async (req, res) => {
  // Lấy các biến này ra sớm để dùng trong 'catch'
  const { clientId, message } = req.body;
  let { chatSessionId } = req.body; // chatSessionId có thể là null ban đầu
  let sessionId = chatSessionId; // Đây là MaPhienChat (sau khi được tạo/tìm thấy)

  try {
    if (!clientId) {
      return res.status(400).json({ error: "clientId is required" });
    }

    console.log(`👤 Khách ID: ${clientId}`);
    console.log(`📩 Tin nhắn từ khách: ${message}`);

    // --- LOGIC QUẢN LÝ PHIÊN CHAT MỚI ---
    // (Giữ nguyên code tìm/tạo phiên chat của bạn)
    let session = null;
    if (sessionId) { // sessionId = chatSessionId từ req.body
      session = await ChatService.findSessionById(sessionId);
      if (!session || session.TrangThai !== "DangHoatDong") {
        sessionId = null; 
        session = null;
      }
    }
    if (!sessionId) {
      session = await ChatService.findActiveSessionByClient(clientId);
      if (session) {
        sessionId = session.MaPhienChat;
      } else {
        session = await ChatService.CreateChatSession(clientId, null); // Tạo phiên AI
        sessionId = session.MaPhienChat;
      }
    }
    // --- KẾT THÚC LOGIC PHIÊN CHAT ---

    await ChatService.saveMessage(sessionId, message, "KhachHang");

    const systemPrompt = `Bối cảnh: Bạn là một nhân viên tư vấn nhiệt tình và am hiểu của thương hiệu trà sữa "Tâm Trà". Nhiệm vụ của bạn là dựa vào menu dưới đây để giới thiệu, giải đáp thắc mắc và giúp khách hàng chọn được món đồ uống ưng ý nhất. Hãy luôn giữ giọng văn thân thiện, vui vẻ.\n${menuPrompt}\nNhiệm vụ: Bây giờ, hãy trả lời câu hỏi của khách hàng dưới đây.\n--- Khách hàng: "${message}"`;

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemma3:4b",
        prompt: systemPrompt,
      }),
    });

    // Thêm kiểm tra lỗi HTTP từ AI
    if (!response.ok) {
        throw new Error(`AI service responded with status ${response.status}`);
    }

    let aiReply = "";
    for await (const chunk of response.body) {
      const text = chunk.toString();
      try {
        const json = JSON.parse(text);
        if (json.response) aiReply += json.response;
      } catch {}
    }

    aiReply = aiReply.trim();
    // Thêm kiểm tra nếu AI trả về rỗng
    if (aiReply === "") {
        throw new Error("AI service returned an empty reply.");
    }
    
    // ... (Lưu tin nhắn AI và gửi về cho client)
    await ChatService.saveMessage(sessionId, aiReply, "HeThong");

    // ✅ Gửi về frontend (luôn gửi lại sessionId đã được xác định chính xác)
    res.json({
      reply: aiReply,
      chatSessionId: sessionId
    });

  } catch (error) {
    // ===== 🚨 ĐÂY LÀ NƠI XỬ LÝ KHI AI LỖI (TRƯỜNG HỢP 2) 🚨 =====
    console.error("❌ ERROR in chatWithAI (AI FAILED):", error.message);

    try {
      const ghiChu = `AI lỗi khi phục vụ ${clientId}: ${error.message}`;
      // 'sessionId' đã được xác định ở khối 'try'
      // Rất quan trọng: Phải đảm bảo `sessionId` có giá trị
      // Nếu lỗi xảy ra TRƯỚC khi `sessionId` được gán (ví dụ: CreateChatSession lỗi)
      // thì chúng ta không thể tạo cảnh báo có MaPhienChat.
      if (!sessionId) {
        console.error("❌❌ LỖI NGHIÊM TRỌNG: AI Lỗi nhưng KHÔNG CÓ sessionId.");
        // Gửi lỗi chung chung cho client
        return res.status(500).json({ 
          error: "Lỗi hệ thống khi tạo phiên chat.",
          reply: "Xin lỗi, đã có lỗi xảy ra khi bắt đầu phiên chat. Vui lòng F5 lại trang."
        });
      }

      // BƯỚC 1: Tạo Cảnh Báo (dùng service)
      const canhBao = await ChatService.createWarning(
        sessionId, 
        clientId, 
        "ai error", // Tên cảnh báo
        ghiChu        // Ghi chú
      );

      // BƯỚC 2: Thông báo cho Admin qua WebSocket (dùng hàm export)
      notifyAdmin({
        type: "support_request", // Admin FE vẫn lắng nghe type này
        clientId: clientId,
        chatSessionId: sessionId, // Đây chính là MaPhienChat của phiên AI
        canhBaoId: canhBao.MaCB,  // Gửi kèm ID cảnh báo
        message: `AI LỖI: Khách ${clientId} cần hỗ trợ ngay!`,
      });
    
    } catch (dbError) {
      // Lỗi này nghiêm trọng (lỗi khi đang xử lý lỗi)
      console.error("❌❌ LỖI NGHIÊM TRỌNG: Không thể tạo Cảnh Báo:", dbError);
    }

    // BƯỚC 3: Gửi tin nhắn xin lỗi cho khách hàng (HTTP Response)
    res.status(500).json({ 
      error: "Đã có lỗi xảy ra từ AI.",
      // Gửi tin nhắn này để client hiển thị
      reply: "Xin lỗi, hệ thống AI đang tạm thời gián đoạn. Chúng tôi đã thông báo cho nhân viên hỗ trợ, bạn vui lòng chờ trong giây lát.",
      chatSessionId: sessionId // Vẫn gửi session ID về
    });
  }
};
/**
 * API: Lấy tin nhắn của phiên liền kề trước đó (để nhân viên xem ngữ cảnh AI)
 * GET /api/chat/history/previous?clientId=...&currentSessionId=...
 */
export const getPreviousSessionHistory = async (req, res) => {
  try {
    const { clientId, currentSessionId } = req.query;

    if (!clientId || !currentSessionId) {
      return res.status(400).json({ error: "Missing clientId or currentSessionId" });
    }

    // Gọi Service đã viết
    const messages = await ChatService.getPreviousSessionMessages(currentSessionId, clientId);
    
    res.json(messages);
  } catch (error) {
    console.error("Error getting previous history:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * API: Lấy toàn bộ lịch sử chat của khách hàng
 * GET /api/chat/history/full/:clientId
 */
export const getFullClientHistory = async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({ error: "Missing clientId" });
    }

    // Gọi Service đã viết
    const messages = await ChatService.getFullClientHistory(clientId);
    
    res.json(messages);
  } catch (error) {
    console.error("Error getting full history:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};