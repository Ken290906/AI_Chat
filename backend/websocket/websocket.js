import { WebSocketServer, WebSocket } from "ws"
import db from "../models/index.js"
import ChatService from "../services/chatService.js"
import AIService from "../services/aiService.js"
import NotificationService from "../services/notificationService.js";

// ===== THAY ĐỔI 1: Quản lý Sockets ở phạm vi module =====
// Chuyển các biến này ra ngoài để notifyAdmin có thể truy cập
const adminSockets = new Map(); // Key: MaNV, Value: { ws, employeeInfo }
const clients = new Map();      // Key: clientId, Value: { ws, chatSessionId }
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

      if (data.type === "ai_error_notify") {
        const { clientId, chatSessionId } = data;
        
        // Tìm cảnh báo AI Error vừa được tạo trong DB để lấy thông tin
        const existingWarning = await db.CanhBao.findOne({
            where: { MaPhienChat: chatSessionId, TenCB: 'ai error' },
            include: [{ model: db.PhanLoaiCanhBao, attributes: ['PhanLoai'] }]
        });

        if (existingWarning) {
            // Gửi thông báo đến TẤT CẢ Admin để nổ chuông/hiển thị popup
            notifyAdmin({
                type: "new_warning",
                warning: existingWarning
            });
            console.log(`🔔 Đã nổ chuông báo lỗi AI cho phiên #${chatSessionId}`);
        }
      }

      // ===== THAY ĐỔI 5: Sửa SUPPORT REQUEST (gửi cho TẤT CẢ) =====
      if (data.type === "support_request") {
        console.log(`🚨 Support request from client: ${data.clientId}`)
        
        let phienChatId = data.chatSessionId 
        const clientId = data.clientId

        try {
          // === BƯỚC 1: Ưu tiên tìm phiên chat đang hoạt động (Fix lỗi tạo phiên 210/211) ===
          // Nếu client không gửi session ID, hoặc gửi sai, ta tìm trong DB trước
          if (!phienChatId) {
             const activeSession = await db.PhienChat.findOne({
                where: { MaKH: clientId, TrangThai: 'DangHoatDong' },
                order: [['ThoiGianBatDau', 'DESC']] 
             });
             
             if (activeSession) {
                phienChatId = activeSession.MaPhienChat;
                console.log(`🔹 Tìm thấy phiên chat đang hoạt động: ${phienChatId} (Sử dụng lại thay vì tạo mới)`);
             }
          }

          // Chỉ tạo mới nếu thực sự không tìm thấy
          if (!phienChatId) {
            console.log(`🔹 Không tìm thấy phiên cũ. Tạo phiên chat mới...`);
            const newSession = await ChatService.CreateChatSession(clientId, null, null);
            phienChatId = newSession.MaPhienChat;
            console.log(`✅ Đã tạo phiên chat mới: ${phienChatId}`);
          }

          // === BƯỚC 2: Chặn cảnh báo kép (Fix lỗi 115 và 116 cùng lúc) ===
          // Kiểm tra xem phiên này đã có cảnh báo nào "ChuaXuLy" chưa?
          // Logic: Nếu vừa bị "ai error" (115), nó sẽ tìm thấy và DỪNG LẠI, không tạo "need support" (116) nữa.
          const existingWarning = await db.CanhBao.findOne({
             where: { 
                 MaPhienChat: phienChatId
             }
          });

          if (existingWarning) {
             console.log(`🛑 Đã tồn tại cảnh báo (ID: ${existingWarning.MaCB}, Loại: ${existingWarning.LoaiCanhBao}). Bỏ qua yêu cầu 'need support' để tránh spam.`);
             
             // Tùy chọn: Nếu bạn vẫn muốn rung chuông admin nhưng không tạo dữ liệu rác
             // Thì có thể gọi notifyAdmin ở đây nhưng dùng existingWarning.
             // Tuy nhiên, tốt nhất là return luôn để admin không bị nhận 2 thông báo.
             //return; 
          }

          // === BƯỚC 3: Nếu chưa có cảnh báo nào, thì tạo mới (Logic cũ) ===
          const canhBao = await ChatService.createWarning(
            phienChatId, 
            clientId, 
            "need support",
            `Khách ${clientId} chủ động yêu cầu hỗ trợ`,
            2 // <--- MaPhanLoai: 2 (Người dùng yêu cầu)
          );

          // === BƯỚC 4: Tạo Thông Báo (MỚI) ===
          const thongBao = await NotificationService.createNotification(
            `Khách ${clientId} yêu cầu hỗ trợ`,
            phienChatId
          );

          // Gửi thông báo socket
          if (adminSockets.size > 0) {
            let notifiedCount = 0;
            const messagePayload = JSON.stringify({
              type: "support_request",
              clientId: clientId,
              chatSessionId: phienChatId, 
              canhBaoId: canhBao.MaCB, 
              message: "Khách hàng cần hỗ trợ gấp!",
            });
            
            for (const [employeeId, adminData] of adminSockets.entries()) {
                if (adminData.ws.readyState === WebSocket.OPEN) {
                    adminData.ws.send(messagePayload);
                    notifiedCount++;
                }
            }
            console.log(`📢 Sent support request to ${notifiedCount}/${adminSockets.size} admins (CB: ${canhBao.MaCB})`);

            // Gửi thông báo loại "new_message_notification" (MỚI)
            notifyAdmin({
              type: "new_message_notification",
              notification: {
                id: thongBao.MaThongBao,
                type: 'support_request', // Để frontend hiển thị icon hỗ trợ
                phienChatId: thongBao.MaPhienChat,
                clientId: thongBao.PhienChat?.MaKH,
                clientName: thongBao.PhienChat?.KhachHang?.HoTen || `Khách ${thongBao.PhienChat?.MaKH}`,
                text: thongBao.NoiDung,
                time: thongBao.ThoiGianTao,
                is_read: thongBao.TrangThai === 'DaDoc',
                avatar: `https://i.pravatar.cc/40?u=sup${thongBao.PhienChat?.MaKH}`,
              }
            });
            
            console.log(`📢 Sent support request and new notification to admins (CB: ${canhBao.MaCB}, TB: ${thongBao.MaThongBao})`);
          } else {
            console.log("❌ No admin connected")
          }
          
        } catch (error) {
          console.error("❌ Lỗi khi xử lý support_request:", error);
        }
        return
      }
      // =======================================================

      // ===== THAY ĐỔI 6: Sửa ADMIN MESSAGE (KHẮC PHỤC LỖI LƯU DB VÀ CHUYỂN TIẾP) =====
      if (data.type === "admin_message") {
          // 💡 KHẮC PHỤC 1: Đảm bảo dữ liệu từ Admin có clientId (FE cần gửi lên)
          console.log(`📤 Admin message to client ${data.clientId}: ${data.message}`)
          const targetClientId = data.clientId; // Lấy ID khách hàng đích
          const clientData = clients.get(targetClientId); // Lấy dữ liệu client (chứa session ID)

          // Kiểm tra xem socket này có phải là admin không
          if (!ws.employeeId) {
              console.error("Lỗi: Nhận được admin_message từ socket không phải admin");
              return;
          }

          // 💡 KHẮC PHỤC 2: Lấy MaPhienChat từ Map clients (đã được cập nhật trong admin_accept_request)
          const phienChatId = clientData ? clientData.chatSessionId : null;
          const employeeId = ws.employeeId;

          if (clientData && clientData.ws.readyState === WebSocket.OPEN) {
              try {
                  if (phienChatId) { 
                      // 1. LƯU VÀO DB (Sử dụng ID an toàn)
                      await ChatService.saveMessage(
                          phienChatId, // Dùng ID lấy từ Map clients (an toàn)
                          data.message,
                          "NhanVien",
                          employeeId,
                      )
                      console.log(`✅ Admin message saved to DB (Session: ${phienChatId})`);
                  } else {
                      console.warn(`❌ Admin message NOT saved: Client ${targetClientId} không có chatSessionId trong RAM.`);
                  }

                  // 2. CHUYỂN TIẾP ĐẾN CLIENT (Logic này hoạt động tốt)
                  clientData.ws.send(JSON.stringify({ type: "admin_message", message: data.message }));
                  console.log(`✅ Admin message delivered`)
              } catch (error) {
                  console.error("❌ Error saving admin message:", error)
              }
          } else {
              console.log(`❌ Client ${data.clientId} not found or disconnected`)
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

      // ===== THAY ĐỔI 8: Sửa ADMIN ACCEPT REQUEST (Bug nghiêm trọng) =====
      if (data.type === "admin_accept_request") {
        console.log(`✅ Admin accepted request:`, data); // Log toàn bộ data

        const client = clients.get(data.clientId);
        if (client && client.ws.readyState === ws.OPEN) {
          try {
            const acceptingEmployeeId = data.employeeId;
            const canhBaoId = data.canhBaoId; // Lấy CanhBao ID từ FE

            if (!acceptingEmployeeId || !canhBaoId) {
              console.error("❌ Lỗi: Admin accept thiếu employeeId hoặc canhBaoId");
              return;
            }

            // Tìm thông tin admin
            const adminData = adminSockets.get(acceptingEmployeeId);
            if (!adminData || !adminData.employeeInfo) {
              console.error(`❌ Lỗi: Admin ${acceptingEmployeeId} không tìm thấy thông tin socket.`);
              return;
            }
            const acceptingEmployee = adminData.employeeInfo;

            // --- BƯỚC 1: Tìm Cảnh Báo để lấy MaPhienChat GỐC ---
            const canhBao = await ChatService.findWarningById(canhBaoId);
            if (!canhBao) {
                console.error(`❌ Lỗi: Không tìm thấy Cảnh Báo với ID: ${canhBaoId}`);
                return;
            }
            // Lấy MaPhienChat GỐC (bị lỗi) từ bản ghi cảnh báo
            const maPhienChatGoc = canhBao.MaPhienChat; 
            console.log(`🔹 Lấy được MaPhienChat GỐC (${maPhienChatGoc}) từ CanhBao ID ${canhBaoId}`);

            // --- BƯỚC 2: Tạo phiên chat MỚI (để hỗ trợ) ---
            const phienChatMoi = await ChatService.CreateChatSession(
              data.clientId,
              acceptingEmployeeId,
              data.clientName || null,
            );

            client.chatSessionId = phienChatMoi.MaPhienChat; // Cập nhật phiên chat MỚI cho client

            // --- BƯỚC 3: Gửi thông tin cho client ---
            client.ws.send(
              JSON.stringify({
                type: "agent_accepted",
                clientId: data.clientId,
                chatSessionId: phienChatMoi.MaPhienChat, // <--- THÊM DÒNG NÀY
                employee: acceptingEmployee,
              }),
            );
            
            console.log(
              `✅ Acceptance sent to client ${data.clientId} with NEW chat session: ${phienChatMoi.MaPhienChat}`,
            );

            // --- BƯỚC 4: Ghi Nhật ký với MaPhienChat GỐC ---
            await ChatService.logAction(
              acceptingEmployeeId,
              "accept_request", // HanhDong
              maPhienChatGoc, // mã phiên chat cần hỗ trợ
              `NV ${acceptingEmployee.HoTen} chấp nhận hỗ trợ (từ CB ID: ${canhBaoId}). Tạo phiên mới: ${phienChatMoi.MaPhienChat}`, // GhiChu
            );

            // --- BƯỚC 5 (MỚI): Broadcast cho TẤT CẢ ADMINS biết là đã có người nhận ---
            console.log(`📢 Broadcasting 'request_claimed' cho (CB ID: ${canhBaoId})`);
            const claimPayload = JSON.stringify({
              type: "request_claimed",
              canhBaoId: canhBaoId,
              clientId: data.clientId, // Gửi clientId để FE dễ tìm
              acceptedByEmployeeId: acceptingEmployeeId,
              acceptedByEmployeeName: acceptingEmployee.HoTen // (Tùy chọn) Gửi tên người nhận
            });

            // Lặp qua tất cả admin đang kết nối và gửi tin
            for (const [employeeId, adminData] of adminSockets.entries()) {
              if (adminData.ws.readyState === WebSocket.OPEN) {
                try {
                  adminData.ws.send(claimPayload);
                } catch (error) {
                  console.error(`❌ Lỗi gửi 'request_claimed' cho admin ${employeeId}:`, error);
                }
              }
            }
            // --- KẾT THÚC BROADCAST ---
          } catch (error) {
            console.error("❌ Error accepting chat:", error);
            client.ws.send(JSON.stringify({ type: "error", message: "Lỗi khi chấp nhận yêu cầu" }));
          }
        } else {
          console.log(`❌ Client ${data.clientId} not found or disconnected`);
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