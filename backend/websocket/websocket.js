import { WebSocketServer, WebSocket } from "ws"
import db from "../models/index.js"
import ChatService from "../services/chatService.js"
import AIService from "../services/aiService.js"
import ThongBaoService from "../services/thongBaoService.js";

// ===== THAY ĐỔI 1: Quản lý Sockets ở phạm vi module =====
// Chuyển các biến này ra ngoài để notifyAdmin có thể truy cập
const adminSockets = new Map(); // Key: MaNV, Value: { ws, employeeInfo }
const clients = new Map();      // Key: clientId, Value: { ws, chatSessionId }
let currentChatSession = null; // CẢNH BÁO: Biến này vẫn là "single-task", sẽ gây lỗi nếu 2 admin chấp nhận 2 khách cùng lúc.
// ========================================================

// ===== THAY ĐỔI 2: Sửa hàm notifyAdmin để gửi cho TẤT CẢ admin =====
/**
 * Gửi một đối tượng message cho TẤT CẢ admin đang kết nối.
 * Dùng cho các module bên ngoài (như chatController khi AI lỗi)
 * @param {object} messageObject - Đối tượng tin nhắn cần gửi (sẽ được JSON.stringify)
 */
export function notifyAdmin(messageObject) {
  if (adminSockets.size === 0) {
    console.log("❌ Không thể thông báo: Không có admin kết nối.");
    return false;
  }

  let notifiedCount = 0;
  const messagePayload = JSON.stringify(messageObject);

  for (const [employeeId, adminData] of adminSockets.entries()) {
      if (adminData.ws.readyState === WebSocket.OPEN) {
          try { 
              adminData.ws.send(messagePayload);
              notifiedCount++;
          } catch (error) { 
              console.error(`❌ Lỗi khi gửi 'support_request' cho admin ${employeeId}:`, error);
          }
      } else { // <-- THÊM KHỐI ELSE NÀY
          // Dọn dẹp "zombie socket"
          // Socket này có trong Map nhưng không 'OPEN' (có thể là 'CLOSED' hoặc 'CLOSING')
          console.log(`🧹 Dọn dẹp zombie socket cho admin ${employeeId}`);
          adminSockets.delete(employeeId);
      }
  }
  
  console.log(`📢 Notified ${notifiedCount}/${adminSockets.size} admins (from external function)`);
  return notifiedCount > 0;
}
// ===================================================================
export function setupWebSocket(server) {
  const wss = new WebSocketServer({ server })

  // ===== THAY ĐỔI 3: Xóa các biến local đã chuyển ra ngoài =====
  // let adminSocket = null (ĐÃ XÓA)
  // let currentEmployee = null (ĐÃ XÓA)
  // const clients = new Map() (ĐÃ XÓA)
  // ===========================================================

  wss.on("connection", (ws, req) => {
    console.log("🟢 New WebSocket connection")

    ws.on("message", async (raw) => {
      let data
      try {
        data = JSON.parse(raw.toString())
        console.log("📨 Received WebSocket message:", data)
      } catch {
        console.error("❌ Invalid message:", raw.toString())
        return
      }

      // ===== THAY ĐỔI 4: Sửa ADMIN REGISTER =====
      if (data.type === "admin_register") {
        try {
          const employeeInfo = await db.NhanVien.findByPk(data.employeeId)
          if (!employeeInfo) {
            ws.send(JSON.stringify({ type: "error", message: "Nhân viên không tồn tại" }));
            return
          }

          const employee = {
            MaNV: employeeInfo.MaNV,
            HoTen: employeeInfo.HoTen,
            Email: employeeInfo.Email,
          }

          // Thêm admin vào Map
          adminSockets.set(employee.MaNV, { ws, employeeInfo: employee }); 
          
          // Gán MaNV vào socket để dễ dàng nhận diện khi 'close'
          ws.employeeId = employee.MaNV; 

          console.log(`👨‍💼 Admin ${employee.HoTen} (${employee.MaNV}) connected. Tổng admin: ${adminSockets.size}`)

          ws.send(
            JSON.stringify({
              type: "admin_registered",
              employee: employee, // Gửi thông tin của chính admin đó
              message: "Admin registered successfully",
            }),
          )
        } catch (error) {
          console.error("❌ Error registering admin:", error)
        }
        return
      }
      // ========================================

      // CLIENT REGISTER - KHÁCH HÀNG ĐĂNG KÝ (Không đổi, vì đã dùng 'clients' Map)
      if (data.type === "client_register") {
        clients.set(data.clientId, { ws, chatSessionId: null })
        console.log(`👤 Client ${data.clientId} connected`)
        ws.send(JSON.stringify({ type: "client_registered", clientId: data.clientId }));
        return
      }

      // ===== THAY ĐỔI 5: Sửa SUPPORT REQUEST (LƯU VÀO BẢNG THONGBAO) =====
      if (data.type === "support_request") {
        console.log(`🚨 Support request from client: ${data.clientId}`);
        
        let phienChatId = data.chatSessionId;
        const clientId = data.clientId;

        try {
          // Tìm hoặc tạo phiên chat
          if (!phienChatId) {
             const activeSession = await db.PhienChat.findOne({
                where: { MaKH: clientId, TrangThai: 'DangHoatDong' },
                order: [['ThoiGianBatDau', 'DESC']] 
             });
             if (activeSession) {
                phienChatId = activeSession.MaPhienChat;
             } else {
                const newSession = await ChatService.CreateChatSession(clientId, null, null);
                phienChatId = newSession.MaPhienChat;
             }
          }

          // Tạo một thông báo trong bảng `thongbao`
          const notificationContent = `Khách hàng ${clientId} đang cần hỗ trợ gấp!`;
          const newNotification = await ThongBaoService.createThongBao(phienChatId, notificationContent);
          console.log(`✅ Created notification ${newNotification.MaThongBao} for support request.`);

          // Gửi thông báo real-time đến TẤT CẢ admin
          const notificationPayload = JSON.stringify({
            type: "new_support_notification", // Sử dụng một loại mới để frontend có thể phân biệt
            notification: newNotification,
            clientId: clientId, // Vẫn gửi kèm để xử lý logic accept
            canhBaoId: newNotification.MaThongBao // Dùng MaThongBao làm ID định danh
          });

          for (const [employeeId, adminData] of adminSockets.entries()) {
            if (adminData.ws.readyState === WebSocket.OPEN) {
              adminData.ws.send(notificationPayload);
            }
          }
          console.log(`📢 Sent 'new_support_notification' to ${adminSockets.size} admins.`);
          
        } catch (error) {
          console.error("❌ Lỗi khi xử lý support_request:", error);
        }
        return;
      }
      // =======================================================

      // ===== THAY ĐỔI 6: Sửa ADMIN MESSAGE =====
      if (data.type === "admin_message") {
        console.log(`📤 Admin message to client ${data.clientId}: ${data.message}`)
        const client = clients.get(data.clientId)

        // Kiểm tra xem ws này có phải là admin không
        if (!ws.employeeId) {
          console.error("Lỗi: Nhận được admin_message từ socket không phải admin");
          return;
        }

        if (client && client.ws.readyState === WebSocket.OPEN) {
          try {
            // Logic 'currentChatSession' này vẫn là một điểm nghẽn
            // Tạm thời chấp nhận là admin chỉ chat được với khách cuối cùng họ chấp nhận
            if (currentChatSession) { 
              await ChatService.saveMessage(
                currentChatSession.MaPhienChat,
                data.message,
                "NhanVien",
                ws.employeeId, // <-- Sửa lỗi: Lấy MaNV từ socket, không dùng currentEmployee
              )
            }
            client.ws.send(JSON.stringify({ type: "admin_message", message: data.message }));
            console.log(`✅ Admin message delivered`)
          } catch (error) {
            console.error("❌ Error saving admin message:", error)
          }
        } else {
          console.log(`❌ Client ${data.clientId} not found`)
        }
        return
      }
      // ========================================

      // ===== THAY ĐỔI 7: Sửa CLIENT MESSAGE (gửi cho TẤT CẢ admin) =====
      if (data.type === "client_message") {
        console.log(`📤 Client message from ${data.clientId}: ${data.message}`);
        
        const clientData = clients.get(data.clientId);
        const clientId = data.clientId;

        try {
          // 1. Lấy Session ID từ RAM trước
          let chatSessionId = clientData ? clientData.chatSessionId : null;

          // === FIX QUAN TRỌNG: CỨU TIN NHẮN CHUYỂN GIAO ===
          // Nếu RAM chưa có SessionId (thường xảy ra ở tin nhắn thứ 3 khi vừa chuyển chế độ từ AI sang Admin)
          // Ta phải tìm phiên chat đang hoạt động trong DB ngay lập tức.
          if (!chatSessionId) {
             const activeSession = await db.PhienChat.findOne({
                where: { MaKH: clientId, TrangThai: 'DangHoatDong' },
                order: [['ThoiGianBatDau', 'DESC']]
             });
             
             if (activeSession) {
                chatSessionId = activeSession.MaPhienChat;
                // Cập nhật ngược lại vào RAM để các tin sau xử lý nhanh hơn
                if (clientData) clientData.chatSessionId = chatSessionId;
                console.log(`🔹 (Fix Lost Msg) Tìm thấy session DB ${chatSessionId} cho tin nhắn chuyển giao.`);
             }
          }

          // 2. Nếu tìm được Session (Dù là từ RAM hay DB), LƯU NGAY LẬP TỨC
          if (chatSessionId) {
            // Lưu vào DB: Đây là bước quan trọng nhất để tin nhắn thứ 3 không bị mất
            await ChatService.saveMessage(chatSessionId, data.message, "KhachHang");
            console.log(`✅ Saved client message to DB (Session: ${chatSessionId})`);

            // =================================================
            // TẠO THÔNG BÁO MỚI KHI KHÁCH HÀNG GỬI TIN NHẮN
            // =================================================
            const notificationContent = `Khách hàng ${clientId} vừa gửi một tin nhắn mới.`;
            const newNotification = await ThongBaoService.createThongBao(chatSessionId, notificationContent);
            console.log(`✅ Created notification ${newNotification.MaThongBao} for new message.`);

            // Gửi thông báo real-time đến TẤT CẢ admin
            const notificationPayload = JSON.stringify({
              type: "new_message_notification",
              notification: newNotification, // Gửi toàn bộ object thông báo mới
            });

            for (const [employeeId, adminData] of adminSockets.entries()) {
              if (adminData.ws.readyState === WebSocket.OPEN) {
                try {
                  adminData.ws.send(notificationPayload);
                } catch (error) {
                  console.error(`❌ Lỗi gửi 'new_message_notification' cho admin ${employeeId}:`, error);
                }
              }
            }
            console.log(`📢 Sent 'new_message_notification' to ${adminSockets.size} admins.`);
            // =================================================

            // 3. Chỉ gửi WebSocket cho Admin NẾU đã có nhân viên phụ trách
            // (Để tránh lỗi gửi tin cho null khi chưa ai nhận)
            const phienChat = await db.PhienChat.findByPk(chatSessionId);
            
            if (phienChat && phienChat.MaNV && phienChat.TrangThai === 'DangHoatDong') {
              const targetEmployeeId = phienChat.MaNV;
              const adminData = adminSockets.get(targetEmployeeId);

              if (adminData && adminData.ws.readyState === WebSocket.OPEN) {
                const messagePayload = JSON.stringify({
                  type: "client_message",
                  clientId: data.clientId,
                  message: data.message,
                });
                adminData.ws.send(messagePayload);
                console.log(`✅ Forwarded to Admin ${targetEmployeeId}`);
              }
          } else {
              // Nếu chưa DangHoatDong, chỉ lưu DB (đã làm ở trên), không gửi Socket
              console.log(`🔹 Message saved to DB but NOT sent to Admin (Status: ${phienChat ? phienChat.TrangThai : 'null'})`);
          }
          } else {
             // Trường hợp cực hữu: Khách chat mà không có phiên nào đang mở
             console.warn(`⚠️ Client ${clientId} chat nhưng không tìm thấy phiên DangHoatDong. Không thể lưu.`);
          }

        } catch (error) {
          console.error("❌ Error processing client message:", error);
        }
        return;
      }
      // ================================================================

      // ===== THAY ĐỔI 8: Sửa ADMIN ACCEPT REQUEST (Logic mới đơn giản hơn) =====
      if (data.type === "admin_accept_request") {
        console.log(`✅ Admin accepted request:`, data);

        const { clientId, employeeId, phienChatId, notificationId } = data;
        const client = clients.get(clientId);

        if (!client || client.ws.readyState !== ws.OPEN) {
          console.log(`❌ Client ${clientId} not found or disconnected`);
          return;
        }
        if (!employeeId || !phienChatId || !notificationId) {
          console.error("❌ Lỗi: Admin accept thiếu employeeId, phienChatId, hoặc notificationId");
          return;
        }

        try {
          const adminData = adminSockets.get(employeeId);
          if (!adminData || !adminData.employeeInfo) {
            console.error(`❌ Lỗi: Admin ${employeeId} không tìm thấy thông tin socket.`);
            return;
          }
          const acceptingEmployee = adminData.employeeInfo;

          // --- BƯỚC 1: Cập nhật phiên chat với nhân viên hỗ trợ ---
          const [updatedCount] = await db.PhienChat.update(
            { MaNV: employeeId, TrangThai: 'DangHoatDong' },
            { where: { MaPhienChat: phienChatId } }
          );

          if (updatedCount === 0) {
            console.error(`❌ Không tìm thấy hoặc không thể cập nhật PhienChat ID: ${phienChatId}`);
            return;
          }
          
          console.log(`✅ Assigned employee ${employeeId} to chat session ${phienChatId}.`);
          client.chatSessionId = phienChatId; // Đảm bảo client có session ID đúng

          // --- BƯỚC 2: Gửi thông tin cho client ---
          client.ws.send(
            JSON.stringify({
              type: "agent_accepted",
              clientId: clientId,
              chatSessionId: phienChatId,
              employee: acceptingEmployee,
            }),
          );
          
          // --- BƯỚC 3: Ghi Nhật ký ---
          await ChatService.logAction(
            employeeId,
            "accept_request",
            phienChatId,
            `NV ${acceptingEmployee.HoTen} chấp nhận hỗ trợ cho phiên chat ${phienChatId}.`,
          );

          // --- BƯỚC 4: Broadcast cho TẤT CẢ ADMINS biết là đã có người nhận ---
          const claimPayload = JSON.stringify({
            type: "request_claimed",
            notificationId: notificationId, // Dùng notificationId để FE xóa
            acceptedByEmployeeId: employeeId,
          });

          for (const [empId, admData] of adminSockets.entries()) {
            if (admData.ws.readyState === WebSocket.OPEN) {
              admData.ws.send(claimPayload);
            }
          }
          console.log(`📢 Broadcasted 'request_claimed' for notification ID: ${notificationId}`);

        } catch (error) {
          console.error("❌ Error accepting chat:", error);
          client.ws.send(JSON.stringify({ type: "error", message: "Lỗi khi chấp nhận yêu cầu" }));
        }
        return;
      }
      // ================================================================

      // ADMIN DECLINE REQUEST - NHÂN VIÊN TỪ CHỐI YÊU CẦU (Không đổi)
      if (data.type === "admin_decline_request") {
        console.log(`❌ Admin declined request for client ${data.clientId}`)
        const client = clients.get(data.clientId)
        if (client && client.ws.readyState === ws.OPEN) {
          client.ws.send(
            JSON.stringify({
              type: "agent_declined",
              message: "⚠️ Rất tiếc, hiện tại các nhân viên đều đang bận. Vui lòng thử lại sau ít phút.",
            }),
          )
          console.log(`✅ Decline sent to client`)
        }
        return
      }
      console.log("⚠️ Unknown message type:", data.type)
    })

    // ===== THAY ĐỔI 9: Sửa hàm "close" =====
    ws.on("close", async () => {
      console.log("🔴 Connection closed");

      // XỬ LÝ ADMIN DISCONNECT
      // ws.employeeId được gán ở 'admin_register'
      if (ws.employeeId) {
        const employeeId = ws.employeeId;
        const adminData = adminSockets.get(employeeId);
        const adminName = adminData ? adminData.employeeInfo.HoTen : `(ID: ${employeeId})`;

        // Chỉ xóa khỏi Map NẾU socket hiện tại (ws) là socket đã được lưu
        if (adminData && adminData.ws === ws) {
          adminSockets.delete(employeeId);
          console.log(`👨‍💼 Admin ${adminName} disconnected. Còn lại: ${adminSockets.size}`);
        } else {
          // Socket cũ (ws) đã đóng, nhưng Map đã bị ghi đè bởi socket mới.
          // Chúng ta KHÔNG XÓA socket mới.
          console.log(`👨‍💼 Admin ${adminName} (socket cũ) đã đóng, socket mới đã kết nối. Không xóa.`);
        }
        // ===================================

        if (currentChatSession && currentChatSession.MaNV === employeeId) {
            currentChatSession = null;
            console.log(`🔹 Reset currentChatSession (vì admin ${employeeId} ngắt kết nối)`);
        }
        return; // Kết thúc
      }

      // XỬ LÝ CLIENT DISCONNECT (Giữ nguyên logic cũ của bạn)
      let disconnectedClientId = null;
      for (const [clientId, clientData] of clients.entries()) {
        if (clientData.ws === ws) {
          clients.delete(clientId); 
          console.log(`👤 Client ${clientId} disconnected`);
          disconnectedClientId = clientId;
          break;
        }
      }

      if (disconnectedClientId) {  
        try {
          console.log(`🔹 Tìm các phiên 'DangHoatDong' cho MaKH: ${disconnectedClientId}`)
          const activeSessions = await db.PhienChat.findAll({
            where: { MaKH: disconnectedClientId, TrangThai: "DangHoatDong" },
          })

          console.log(`🔹 Tìm thấy ${activeSessions.length} phiên đang hoạt động.`)
          for (const phienChat of activeSessions) {
            await ChatService.endChatSession(phienChat.MaPhienChat)
            console.log(`✅ Đã tự động đóng phiên chat ${phienChat.MaPhienChat}`)
            AIService.updateCustomerPreferences(phienChat.MaPhienChat);// cập nhật sở thích khách hàng
            AIService.summarizeSession(phienChat.MaPhienChat); // tóm tắt phiên chat
          }
          
          if (currentChatSession && currentChatSession.MaKH === disconnectedClientId) {
            currentChatSession = null
            console.log(`🔹 Reset currentChatSession (vì client ${disconnectedClientId} ngắt kết nối)`)
          }
        } catch (error) {
          console.error(`❌ Lỗi khi tìm/đóng phiên chat cho ${disconnectedClientId}:`, error)
        }
        return; 
      }
    }) // Kết thúc ws.on("close")
    // =======================================

    ws.on("error", (error) => {
      console.error("❌ WebSocket error:", error)
    })
  }) // Kết thúc wss.on("connection")

  console.log("✅ WebSocket server setup completed")
  return wss
}