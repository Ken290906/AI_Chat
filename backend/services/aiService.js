import fetch from "node-fetch"; // Dùng thư viện có sẵn trong project của bạn
import db from "../models/index.js";

const AIService = {
  /**
   * Tự động phân tích hội thoại và cập nhật sở thích khách hàng bằng Gemma 3 (Ollama)
   * @param {number} chatSessionId - ID phiên chat vừa kết thúc
   */
  async updateCustomerPreferences(chatSessionId) {
    try {
      console.log(`🧠 AI (Gemma3) đang phân tích sở thích từ phiên chat: ${chatSessionId}...`);

      // 1. Lấy dữ liệu tin nhắn và khách hàng từ DB
      const phienChat = await db.PhienChat.findByPk(chatSessionId, {
        include: [
          {
            model: db.TinNhan,
            attributes: ['NguoiGui', 'NoiDung', 'ThoiGianGui'],
            order: [['ThoiGianGui', 'ASC']]
          }
        ]
      });

      // Nếu không có tin nhắn, bỏ qua
      if (!phienChat || !phienChat.TinNhans || phienChat.TinNhans.length === 0) {
        console.log("⚠️ Phiên chat không có nội dung để phân tích.");
        return;
      }

      const customerId = phienChat.MaKH;

      // 2. Lấy sở thích CŨ (nếu có)
      const currentPreference = await db.SoThich.findOne({ where: { MaKH: customerId } });
      const oldPreferenceText = currentPreference ? currentPreference.GhiChu : "Chưa có dữ liệu.";

      // 3. Chuẩn bị dữ liệu hội thoại
      const chatHistoryText = phienChat.TinNhans.map(msg => {
        const sender = msg.NguoiGui === 'KhachHang' ? 'Khách' : 'Nhân viên/AI';
        return `${sender}: ${msg.NoiDung}`;
      }).join('\n');

      // 4. Viết Prompt cho Gemma 3
      // Lưu ý: Prompt cần rõ ràng vì model local 4b có thể kém hơn model cloud một chút
      const systemPrompt = `
        Bạn là trợ lý quản lý thông tin khách hàng.
        
        THÔNG TIN CŨ: "${oldPreferenceText}"
        
        HỘI THOẠI MỚI:
        ${chatHistoryText}
        
        NHIỆM VỤ:
        Hãy đọc hội thoại mới và cập nhật thông tin sở thích của khách hàng (món yêu thích, dị ứng, thói quen uống ngọt/nhạt, thái độ...).
        Kết hợp với thông tin cũ để tạo ra bản tóm tắt ngắn gọn nhất (dưới 100 từ).
        Chỉ trả về nội dung tóm tắt, không cần lời chào.
      `;

      // 5. Gọi API Ollama (Local)
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemma3:4b", // Dùng đúng model bạn đang có
          prompt: systemPrompt,
          stream: false // Tắt stream để nhận 1 cục kết quả cho dễ xử lý
        }),
      });

      if (!response.ok) throw new Error(`Ollama error: ${response.status}`);

      const data = await response.json();
      const newPreferenceText = data.response.trim();

      console.log(`✅ AI (Gemma3) kết luận sở thích (KH ${customerId}):`, newPreferenceText);

      // 6. Cập nhật vào DB (Bảng sothich)
      if (currentPreference) {
        await currentPreference.update({ GhiChu: newPreferenceText });
      } else {
        await db.SoThich.create({ MaKH: customerId, GhiChu: newPreferenceText });
      }

    } catch (error) {
      console.error("❌ Lỗi khi AI tổng hợp sở thích:", error.message);
    }
  },
  // --- HÀM 2: TÓM TẮT PHIÊN CHAT (MỚI) ---
  async summarizeSession(chatSessionId) {
    try {
      console.log(`📝 AI đang tóm tắt nội dung phiên chat: ${chatSessionId}...`);

      const phienChat = await db.PhienChat.findByPk(chatSessionId, {
        include: [{
            model: db.TinNhan,
            attributes: ['NguoiGui', 'NoiDung'],
            order: [['ThoiGianGui', 'ASC']]
        }]
      });

      if (!phienChat || !phienChat.TinNhans.length) return;

      // Chuẩn bị nội dung hội thoại
      const chatHistoryText = phienChat.TinNhans.map(msg => {
        const sender = msg.NguoiGui === 'KhachHang' ? 'Khách' : 'Nhân viên/AI';
        return `${sender}: ${msg.NoiDung}`;
      }).join('\n');

      // Prompt cho Gemma 3: Yêu cầu tóm tắt nghiệp vụ
      const prompt = `
        Bạn là thư ký cuộc họp. Dưới đây là đoạn chat giữa khách hàng và quán:
        
        --- BẮT ĐẦU ĐOẠN CHAT ---
        ${chatHistoryText}
        --- KẾT THÚC ĐOẠN CHAT ---

        NHIỆM VỤ:
        1. Tóm tắt ngắn gọn nội dung chính của cuộc trò chuyện (Khách hỏi gì? Đã giải quyết thế nào?).
        2. Đánh giá kết quả ngắn gọn (Ví dụ: "Khách đã đặt hàng", "Khách chỉ hỏi thăm", "Khách phàn nàn").
        3. Chỉ trả về nội dung tóm tắt, không chào hỏi.
      `;

      // Gọi Ollama
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemma3:4b",
          prompt: prompt,
          stream: false
        }),
      });

      if (!response.ok) throw new Error("Ollama Error");
      
      const data = await response.json();
      const summaryText = data.response.trim();

      console.log(`✅ AI tóm tắt xong phiên ${chatSessionId}`);

      // Lưu vào bảng tomtatphienchat
      // Dùng findOrCreate để tránh trùng lặp nếu chạy 2 lần
      const [summary, created] = await db.TomTatPhienChat.findOrCreate({
        where: { MaPhienChat: chatSessionId },
        defaults: {
          NoiDungTomTat: summaryText,
          KetQuaTuAI: "Đã xử lý" // Bạn có thể yêu cầu AI trích xuất trạng thái này riêng nếu muốn xịn hơn
        }
      });

      if (!created) {
        summary.NoiDungTomTat = summaryText;
        await summary.save();
      }

    } catch (error) {
      console.error("❌ Lỗi khi AI tóm tắt phiên chat:", error.message);
    }
  }
};

export default AIService;