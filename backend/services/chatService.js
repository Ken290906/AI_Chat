import db from "../models/index.js"
const { Op } = db.Sequelize;

export class ChatService {
  static async CreateChatSession(clientId, employeeId, clientName = null) {
    try {
      console.log(`🔹 Creating new chat session for client: ${clientId}, employee: ${employeeId}`)

      // Tìm hoặc tạo khách hàng
      let khachHang = await db.KhachHang.findOne({
        where: { MaKH: clientId },
      })

      if (!khachHang) {
        console.log(`🔹 Creating new customer: ${clientId}`)
        khachHang = await db.KhachHang.create({
          MaKH: clientId,
          HoTen: clientName || `Khách_${clientId}`,
          Email: null,
          SoDienThoai: null,
        })
      }

      console.log(`🔹 Creating new chat session`)
      const phienChat = await db.PhienChat.create({
        MaKH: khachHang.MaKH,
        MaNV: employeeId,
        ThoiGianBatDau: new Date(),
        ThoiGianKetThuc: null,
        TrangThai: "DangHoatDong",
      })

      console.log(`✅ Chat session created: ${phienChat.MaPhienChat}`)
      return phienChat
    } catch (error) {
      console.error("❌ Lỗi tạo phiên chat:", error)
      throw error
    }
  }
  // Tìm phiên chat theo ID
  static async findSessionById(chatSessionId) {
    try {
      console.log(`🔹 Finding session by ID: ${chatSessionId}`)
      return await db.PhienChat.findByPk(chatSessionId)
    } catch (error) {
      console.error("❌ Lỗi tìm kiếm phiên chat theo ID:", error)
      throw error
    }
  }

  // Tìm phiên chat đang hoạt động của khách hàng
  static async findActiveSessionByClient(clientId) {
    try {
      console.log(`🔹 Finding active session for client: ${clientId}`)
      const phienChat = await db.PhienChat.findOne({
        where: { 
          MaKH: clientId, // Chỉ tìm của khách hàng này
          TrangThai: "DangHoatDong" // Và phiên phải đang hoạt động
        },
        order: [["ThoiGianBatDau", "DESC"]], // Lấy phiên gần nhất (nếu lỡ có > 1)
      })
      return phienChat
    } catch (error) {
      console.error("❌ Lỗi tìm kiếm phiên chat đang hoạt động:", error)
      throw error
    }
  }

  static async saveMessage(chatSessionId, message, nguoiGui, senderId = null) {
    try {
      console.log(`🔹 Saving message for chat ${chatSessionId}, from: ${nguoiGui}`)

      const tinNhan = await db.TinNhan.create({
        MaPhienChat: chatSessionId,
        NoiDung: message,
        ThoiGianGui: new Date(),
        NguoiGui: nguoiGui,
      })

      console.log(`Message saved: ${tinNhan.MaTinNhan}`)
      return tinNhan
    } catch (error) {
      console.error(" Lỗi lưu tin nhắn:", error)
      throw error
    }
  }

/**
   * Phương thức MỚI: Tạo một bản ghi cảnh báo (CanhBao)
   * @param {string} chatSessionId - ID của phiên chat (AI)
   * @param {string} clientId - ID của khách hàng
   * @param {string} tenCanhBao - Tên cảnh báo (ví dụ: "need support" hoặc "ai error")
   * @param {string} [ghiChu] - Ghi chú tùy chọn
   * @returns {Promise<object>} Bản ghi CanhBao vừa được tạo
   */
  static async createWarning(chatSessionId, clientId, tenCanhBao = "need support", ghiChu = null) {
    try {
      console.log(`Creating warning for chat: ${chatSessionId}, client: ${clientId}`);
      
      const canhBao = await db.CanhBao.create({
        TenCB: tenCanhBao,
        MaPhanLoai: 1, // Giả sử 1 là "cần hỗ trợ"
        GhiChu: ghiChu || `Khách ${clientId} cần hỗ trợ`,
        MaPhienChat: chatSessionId, // LƯU LẠI PHIÊN CHAT (AI)
      });

      // Sau khi tạo, fetch lại bản ghi để có đầy đủ các include cần thiết cho frontend
      const fullCanhBao = await db.CanhBao.findByPk(canhBao.MaCB, {
        include: [{
          model: db.PhanLoaiCanhBao,
          attributes: ['PhanLoai']
        }]
      });

      console.log(`Warning created: ${fullCanhBao.MaCB}`);
      return fullCanhBao;

    } catch (error) {
      console.error("Lỗi khi tạo Cảnh Báo:", error);
      throw error;
    }
  }
  // --- HÀM MỚI ĐỂ TÌM CẢNH BÁO ---
  /**
   * Tìm một Cảnh Báo bằng ID (MaCB)
   * @param {number} canhBaoId - ID của Cảnh Báo (MaCB)
   * @returns {Promise<object|null>} Bản ghi CanhBao hoặc null nếu không tìm thấy
   */
  static async findWarningById(canhBaoId) {
    try {
      console.log(`Finding warning by ID: ${canhBaoId}`);
      const canhBao = await db.CanhBao.findByPk(canhBaoId);
      if (!canhBao) {
        console.log(`Warning not found: ${canhBaoId}`);
        return null;
      }
      return canhBao;
    } catch (error) {
      console.error("Lỗi khi tìm Cảnh Báo:", error);
      throw error; // Ném lỗi để websocket.js có thể bắt
    }
  }

  /**
   * Ghi lại một hành động của nhân viên vào NhatKyXuLy
   * @param {number} employeeId - ID của nhân viên (MaNV)
   * @param {string} action - Mô tả hành động (HanhDong)
   * @param {number} [chatSessionId] - ID của phiên chat liên quan (MaPhienChat)
   * @param {string} [note] - Ghi chú chi tiết (GhiChu)
   * @returns {Promise<object>} Bản ghi NhatKyXuLy vừa được tạo
   */
  static async logAction(employeeId, action, chatSessionId = null, note = null) {
    try {
      console.log(
        `Ghi nhật ký hành động cho NV ${employeeId}: ${action}`,
      )

      const logEntry = await db.NhatKyXuLy.create({
        MaNV: employeeId,
        MaPhienChat: chatSessionId,
        HanhDong: action,
        GhiChu: note,
        // ThoiGian sẽ tự động được gán bởi CURRENT_TIMESTAMP (dựa theo schema)
      })

      console.log(`Đã ghi nhật ký hành động: ${logEntry.MaNhatKy}`)
      return logEntry
    } catch (error) {
      console.error("Lỗi khi ghi NhatKyXuLy:", error)
      // Không ném lỗi ra ngoài để tránh làm hỏng luồng chính
      // throw error;
    }
  }

  static async getChatHistory(chatSessionId) {
    try {
      console.log(`Getting chat history for: ${chatSessionId}`)

      const messages = await db.TinNhan.findAll({
        where: { MaPhienChat: chatSessionId },
        order: [["ThoiGianGui", "ASC"]],
      })

      console.log(`Found ${messages.length} messages`)
      return messages
    } catch (error) {
      console.error("Lỗi lấy lịch sử chat:", error)
      throw error
    }
  }

  static async endChatSession(chatSessionId, employeeId = null) {
    try {
      console.log(`Ending chat session: ${chatSessionId}`)

      const phienChat = await db.PhienChat.findByPk(chatSessionId)
      if (phienChat) {
        phienChat.TrangThai = "DaKetThuc"
        phienChat.ThoiGianKetThuc = new Date()
        await phienChat.save()

        if (employeeId) {
          await db.NhatKyXuLy.create({
            MaNV: employeeId,
            MaPhienChat: chatSessionId,
            HanhDong: "end_chat",
            GhiChu: "Kết thúc phiên chat",
            ThoiGian: new Date(),
          })
        }

        console.log(`Chat session ended with status DaKetThuc`)
      }
      return phienChat
    } catch (error) {
      console.error("Lỗi kết thúc chat:", error)
      throw error
    }
  }

  static async pauseChatSession(chatSessionId) {
    try {
      console.log(`Pausing chat session: ${chatSessionId}`)

      const phienChat = await db.PhienChat.findByPk(chatSessionId)
      if (phienChat) {
        phienChat.TrangThai = "DangCho"
        await phienChat.save()
        console.log(`Chat session paused, status changed to DangCho`)
      }
      return phienChat
    } catch (error) {
      console.error("Lỗi tạm dừng chat:", error)
      throw error
    }
  }

  static async getPreviousSessionMessages(currentChatSessionId, clientId) {
    try {
      console.log(`Tìm phiên chat liền kề trước đó của khách: ${clientId}`);

      // Bước 1: Tìm phiên chat gần nhất của khách này, nhưng KHÔNG PHẢI phiên hiện tại
      // Logic: Lấy tất cả phiên của MaKH=3, trừ phiên 173, sắp xếp giảm dần theo thời gian -> Lấy cái đầu tiên.
      const previousSession = await db.PhienChat.findOne({
        where: {
          MaKH: clientId, // BẮT BUỘC: Phải đúng khách này
          MaPhienChat: { 
            [Op.ne]: currentChatSessionId // ne = Not Equal (Khác phiên hiện tại)
          },
          // Đảm bảo lấy phiên cũ hơn (đề phòng trường hợp tạo nhầm phiên tương lai)
          ThoiGianBatDau: {
             [Op.lt]: new Date() // (Tuỳ chọn)
          }
        },
        // Sắp xếp theo thời gian bắt đầu giảm dần (Mới nhất lên đầu)
        order: [
            ['ThoiGianBatDau', 'DESC'], 
            ['MaPhienChat', 'DESC'] // Nếu trùng giờ thì lấy theo ID
        ],
      });

      if (!previousSession) {
        console.log("Khách hàng này chưa có phiên chat nào trước đó.");
        return [];
      }

      console.log(`Đã tìm thấy phiên liền kề: ${previousSession.MaPhienChat} (Ngày: ${previousSession.ThoiGianBatDau})`);

      // Bước 2: Lấy danh sách tin nhắn của phiên vừa tìm được
      const messages = await db.TinNhan.findAll({
        where: { MaPhienChat: previousSession.MaPhienChat },
        order: [["ThoiGianGui", "ASC"]], // Tin nhắn xếp theo thứ tự thời gian xuôi
      });

      return messages; // Trả về danh sách tin nhắn
    } catch (error) {
      console.error("Lỗi lấy tin nhắn phiên trước:", error);
      throw error;
    }
  }

  // ================================================================
  //  2. HÀM LẤY TOÀN BỘ LỊCH SỬ (Khi nhân viên muốn xem tất cả)
  // ================================================================
  static async getFullClientHistory(clientId) {
    try {
      console.log(`Lấy toàn bộ tin nhắn của khách: ${clientId}`);

      // Lấy tin nhắn, JOIN với bảng PhienChat để lọc theo MaKH
      // Cách này tối ưu: Chỉ lấy tin nhắn thuộc về các phiên của khách hàng đó
      const allMessages = await db.TinNhan.findAll({
        include: [{
          model: db.PhienChat,
          where: { MaKH: clientId }, // Chỉ lấy tin nhắn của khách này
          attributes: ['MaPhienChat', 'ThoiGianBatDau'], // Lấy thêm thời gian phiên để hiển thị phân cách
        }],
        order: [
          [db.PhienChat, 'ThoiGianBatDau', 'ASC'], // Sắp xếp các phiên theo thứ tự thời gian
          ['ThoiGianGui', 'ASC']                    // Trong mỗi phiên, tin nhắn xếp xuôi
        ]
      });

      console.log(`Đã lấy ${allMessages.length} tin nhắn toàn bộ lịch sử.`);
      return allMessages;
    } catch (error) {
      console.error("Lỗi lấy toàn bộ lịch sử:", error);
      throw error;
    }
  }
}

export default ChatService