import { WebSocketServer, WebSocket } from "ws"
import db from "../models/index.js"
import ChatService from "../services/chatService.js"

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

      // ===== THAY ĐỔI 5: Sửa SUPPORT REQUEST (gửi cho TẤT CẢ) =====
      if (data.type === "support_request") {
        console.log(`🚨 Support request from client: ${data.clientId}`)
        
        let phienChatId = data.chatSessionId 
        const clientId = data.clientId

        try {
          // Nếu không có phiên chat, hãy tạo một phiên mới
          if (!phienChatId) {
            console.log(`🔹 support_request không có chatSessionId. Tạo phiên chat mới...`);
            const newSession = await ChatService.CreateChatSession(clientId, null, null); // Chưa có nhân viên nào chấp nhận
            phienChatId = newSession.MaPhienChat;
            console.log(`✅ Đã tạo phiên chat mới: ${phienChatId}`);
          }
          const canhBao = await ChatService.createWarning(
            phienChatId, clientId, "need support",
            `Khách ${clientId} chủ động yêu cầu hỗ trợ`
          );

          // B2: Gửi yêu cầu cho TẤT CẢ Admin
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
                    try { 
                        adminData.ws.send(messagePayload);
                        notifiedCount++;
                    } catch (error) { 
                        console.error(`❌ Lỗi khi gửi 'support_request' cho admin ${employeeId}:`, error);
                    }
                } else {
                    // ===== THÊM KHỐI ELSE NÀY =====
                    // Dọn dẹp "zombie socket"
                    // Socket này có trong Map nhưng không 'OPEN' (có thể là 'CLOSED' hoặc 'CLOSING')
                    console.log(`🧹 Dọn dẹp zombie socket (trong lúc gửi) cho admin ${employeeId}`);
                    adminSockets.delete(employeeId);
                    // ===================================
                }
            }
            console.log(`📢 Sent support request to ${notifiedCount}/${adminSockets.size} admins (CB: ${canhBao.MaCB})`);
          } else {
            console.log("❌ No admin connected (nhưng đã lưu Cảnh BÁO)")
          }
          
        } catch (error) {
          console.error("❌ Lỗi khi tạo bản ghi Cảnh Báo (client request):", error);
        }
        return
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

        // 1. Kiểm tra xem client có đang trong phiên chat với Admin không
        // (Nếu clientData.chatSessionId là null, nghĩa là họ đang chat với AI -> không làm gì cả)
        if (clientData && clientData.chatSessionId) {
          const chatSessionId = clientData.chatSessionId;
          let targetEmployeeId = null;

          try {
            // 2. Lưu tin nhắn vào DB
            await ChatService.saveMessage(chatSessionId, data.message, "KhachHang");

            // 3. Tìm phiên chat để lấy MaNV (Admin) đang phụ trách
            const phienChat = await db.PhienChat.findByPk(chatSessionId);
            if (phienChat && phienChat.MaNV) {
              targetEmployeeId = phienChat.MaNV;
            } else {
              console.log(`❌ Không tìm thấy PhienChat hoặc MaNV cho session ${chatSessionId}`);
              return; // Không tìm thấy admin phụ trách
            }

            // 4. Tìm socket của admin đó
            const adminData = adminSockets.get(targetEmployeeId);

            // 5. Gửi tin nhắn CHỈ cho admin đó
            if (adminData && adminData.ws.readyState === WebSocket.OPEN) {
              const messagePayload = JSON.stringify({
                type: "client_message",
                clientId: data.clientId,
                message: data.message,
              });
              
              adminData.ws.send(messagePayload);
              console.log(`✅ Client message delivered to Admin ${targetEmployeeId}`);
            } else {
              console.log(`❌ Client ${data.clientId} sent message, but Admin ${targetEmployeeId} is not connected.`);
              // (Tin nhắn đã được lưu vào DB, admin sẽ thấy khi tải lại)
            }
          } catch (error) {
            console.error("❌ Error processing client message:", error);
          }
        } else {
          // Client không có chatSessionId (tức là đang chat với AI)
          // Không cần làm gì ở server (vì logic AI nằm ở client)
          console.log("🔹 Client message (cho AI) received, no admin action.");
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

            currentChatSession = phienChatMoi; // (Vẫn là điểm nghẽn)
            client.chatSessionId = phienChatMoi.MaPhienChat; // Cập nhật phiên chat MỚI cho client

            // --- BƯỚC 3: Gửi thông tin cho client ---
            client.ws.send(
              JSON.stringify({
                type: "agent_accepted",
                clientId: data.clientId,
                chatSessionId: phienChatMoi.MaPhienChat, // Gửi ID phiên MỚI
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