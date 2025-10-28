import db from "../models/index.js"

export class ChatService {
  // Tìm hoặc tạo phiên chat giữa khách hàng và nhân viên
  static async findOrCreateChatSession(clientId, employeeId, clientName = null) {
    try {
      console.log(`🔹 Finding or creating chat session for client: ${clientId}, employee: ${employeeId}`)

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

      let phienChat = await db.PhienChat.findOne({
        where: {
          MaKH: khachHang.MaKH,
          MaNV: employeeId,
        },
      })

      if (phienChat) {
        console.log(`🔹 Found existing chat session: ${phienChat.MaPhienChat}, updating status`)
        phienChat.TrangThai = "DangHoatDong"
        phienChat.ThoiGianBatDau = new Date()
        await phienChat.save()
      } else {
        console.log(`🔹 Creating new chat session`)
        phienChat = await db.PhienChat.create({
          MaKH: khachHang.MaKH,
          MaNV: employeeId,
          ThoiGianBatDau: new Date(),
          ThoiGianKetThuc: null,
          TrangThai: "DangHoatDong",
        })
      }

      console.log(`✅ Chat session ready: ${phienChat.MaPhienChat}`)
      return phienChat
    } catch (error) {
      console.error("❌ Lỗi tìm/tạo phiên chat:", error)
      throw error
    }
  }

  // Lưu tin nhắn
  static async saveMessage(chatSessionId, message, nguoiGui, senderId = null) {
    try {
      console.log(`🔹 Saving message for chat ${chatSessionId}, from: ${nguoiGui}`)

      const tinNhan = await db.TinNhan.create({
        MaPhienChat: chatSessionId,
        NoiDung: message,
        ThoiGianGui: new Date(),
        NguoiGui: nguoiGui, // 'KhachHang', 'NhanVien', hoặc 'HeThong'
      })

      console.log(`✅ Message saved: ${tinNhan.MaTinNhan}`)
      return tinNhan
    } catch (error) {
      console.error("❌ Lỗi lưu tin nhắn:", error)
      throw error
    }
  }

  // Lấy lịch sử chat
  static async getChatHistory(chatSessionId) {
    try {
      console.log(`🔹 Getting chat history for: ${chatSessionId}`)

      const messages = await db.TinNhan.findAll({
        where: { MaPhienChat: chatSessionId },
        order: [["ThoiGianGui", "ASC"]],
      })

      console.log(`✅ Found ${messages.length} messages`)
      return messages
    } catch (error) {
      console.error("❌ Lỗi lấy lịch sử chat:", error)
      throw error
    }
  }

  // Kết thúc phiên chat
  static async endChatSession(chatSessionId, employeeId = null) {
    try {
      console.log(`🔹 Ending chat session: ${chatSessionId}`)

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

        console.log(`✅ Chat session ended`)
      }
      return phienChat
    } catch (error) {
      console.error("❌ Lỗi kết thúc chat:", error)
      throw error
    }
  }

  // Tạm dừng phiên chat (chuyển sang DangCho)
  static async pauseChatSession(chatSessionId) {
    try {
      console.log(`🔹 Pausing chat session: ${chatSessionId}`)

      const phienChat = await db.PhienChat.findByPk(chatSessionId)
      if (phienChat) {
        phienChat.TrangThai = "DangCho"
        await phienChat.save()
        console.log(`✅ Chat session paused, status changed to DangCho`)
      }
      return phienChat
    } catch (error) {
      console.error("❌ Lỗi tạm dừng chat:", error)
      throw error
    }
  }
}

export default ChatService
