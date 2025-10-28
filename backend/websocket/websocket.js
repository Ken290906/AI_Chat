import { WebSocketServer } from "ws"
import db from "../models/index.js"
import ChatService from "../services/chatService.js"

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ server })

  let adminSocket = null
  let currentEmployee = null
  let currentChatSession = null // Lưu phiên chat hiện tại
  const clients = new Map() // clientId -> {ws, chatSessionId}

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

      // ADMIN REGISTER - NHÂN VIÊN ĐĂNG KÝ
      if (data.type === "admin_register") {
        try {
          const employeeInfo = await db.NhanVien.findByPk(data.employeeId)
          if (!employeeInfo) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: "Nhân viên không tồn tại",
              }),
            )
            return
          }

          adminSocket = ws
          currentEmployee = {
            MaNV: employeeInfo.MaNV,
            HoTen: employeeInfo.HoTen,
            Email: employeeInfo.Email,
          }

          console.log(`👨‍💼 Admin ${employeeInfo.HoTen} (${data.employeeId}) connected`)

          ws.send(
            JSON.stringify({
              type: "admin_registered",
              employee: currentEmployee,
              message: "Admin registered successfully",
            }),
          )
        } catch (error) {
          console.error("❌ Error registering admin:", error)
        }
        return
      }

      // CLIENT REGISTER - KHÁCH HÀNG ĐĂNG KÝ
      if (data.type === "client_register") {
        clients.set(data.clientId, { ws, chatSessionId: null })
        console.log(`👤 Client ${data.clientId} connected`)

        ws.send(
          JSON.stringify({
            type: "client_registered",
            clientId: data.clientId,
          }),
        )
        return
      }

      // SUPPORT REQUEST - KHÁCH HÀNG YÊU CẦU HỖ TRỢ
      if (data.type === "support_request") {
        console.log(`🚨 Support request from client: ${data.clientId}`)
        if (adminSocket) {
          adminSocket.send(
            JSON.stringify({
              type: "support_request",
              clientId: data.clientId,
              message: "Khách hàng cần hỗ trợ gấp!",
            }),
          )
          console.log(`📢 Sent support request to admin`)
        } else {
          console.log("❌ No admin connected")
        }
        return
      }

      // ADMIN MESSAGE - NHÂN VIÊN GỬI TIN NHẮN CHO KHÁCH
      if (data.type === "admin_message") {
        console.log(`📤 Admin message to client ${data.clientId}: ${data.message}`)
        const client = clients.get(data.clientId)

        if (client && client.ws.readyState === ws.OPEN) {
          try {
            if (currentChatSession) {
              await ChatService.saveMessage(
                currentChatSession.MaPhienChat,
                data.message,
                "NhanVien",
                currentEmployee.MaNV,
              )
            }

            client.ws.send(
              JSON.stringify({
                type: "admin_message",
                message: data.message,
              }),
            )
            console.log(`✅ Admin message delivered`)
          } catch (error) {
            console.error("❌ Error saving admin message:", error)
          }
        } else {
          console.log(`❌ Client ${data.clientId} not found`)
        }
        return
      }

      // CLIENT MESSAGE - KHÁCH GỬI TIN NHẮN CHO NHÂN VIÊN
      if (data.type === "client_message") {
        console.log(`📤 Client message from ${data.clientId}: ${data.message}`)

        if (adminSocket) {
          try {
            const clientData = clients.get(data.clientId)
            if (clientData && clientData.chatSessionId) {
              await ChatService.saveMessage(clientData.chatSessionId, data.message, "KhachHang")
            }

            adminSocket.send(
              JSON.stringify({
                type: "client_message",
                clientId: data.clientId,
                message: data.message,
              }),
            )
            console.log(`✅ Client message delivered to admin`)
          } catch (error) {
            console.error("❌ Error saving client message:", error)
          }
        } else {
          console.log("❌ No admin connected")
        }
        return
      }

      // ADMIN ACCEPT REQUEST - NHÂN VIÊN CHẤP NHẬN YÊU CẦU
      if (data.type === "admin_accept_request") {
        console.log(`✅ Admin accepted request for client ${data.clientId}`)

        const client = clients.get(data.clientId)
        if (client && client.ws.readyState === ws.OPEN) {
          try {
            const phienChat = await ChatService.findOrCreateChatSession(
              data.clientId,
              currentEmployee.MaNV,
              data.clientName || null,
            )

            currentChatSession = phienChat
            client.chatSessionId = phienChat.MaPhienChat

            // Gửi thông tin nhân viên cho client
            client.ws.send(
              JSON.stringify({
                type: "agent_accepted",
                clientId: data.clientId,
                chatSessionId: phienChat.MaPhienChat,
                employee: currentEmployee,
              }),
            )

            console.log(`✅ Acceptance sent to client ${data.clientId} with chat session: ${phienChat.MaPhienChat}`)
          } catch (error) {
            console.error("❌ Error accepting chat:", error)
            client.ws.send(
              JSON.stringify({
                type: "error",
                message: "Lỗi khi chấp nhận yêu cầu",
              }),
            )
          }
        } else {
          console.log(`❌ Client ${data.clientId} not found or disconnected`)
        }
        return
      }

      // ADMIN DECLINE REQUEST - NHÂN VIÊN TỪ CHỐI YÊU CẦU
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

    ws.on("close", async () => {
      console.log("🔴 Connection closed")

      // Handle client disconnect
      for (const [clientId, clientData] of clients.entries()) {
        if (clientData.ws === ws) {
          clients.delete(clientId)
          console.log(`👤 Client ${clientId} disconnected`)

          if (clientData.chatSessionId) {
            try {
              await ChatService.pauseChatSession(clientData.chatSessionId)
              console.log(`✅ Chat session ${clientData.chatSessionId} paused`)
            } catch (error) {
              console.error("❌ Error pausing chat session:", error)
            }

            if (currentChatSession && currentChatSession.MaPhienChat === clientData.chatSessionId) {
              currentChatSession = null
              console.log(`🔹 Reset currentChatSession because client ${clientId} disconnected`)
            }
          }
          break
        }
      }

      // Handle admin disconnect
      if (ws === adminSocket) {
        adminSocket = null

        if (currentEmployee) {
          try {
            console.log(`[v0] Admin disconnecting - finding chat sessions for MaNV: ${currentEmployee.MaNV}`)
            const phienChats = await db.PhienChat.findAll({
              where: {
                MaNV: currentEmployee.MaNV,
                TrangThai: "DangHoatDong",
              },
            })

            console.log(`[v0] Found ${phienChats.length} active chat sessions for admin`)

            for (const phienChat of phienChats) {
              try {
                console.log(`[v0] Pausing chat session: ${phienChat.MaPhienChat}`)
                await ChatService.pauseChatSession(phienChat.MaPhienChat)
              } catch (error) {
                console.error(`❌ Error pausing chat session ${phienChat.MaPhienChat}:`, error)
              }
            }
            console.log(`✅ All chat sessions paused for admin`)
          } catch (error) {
            console.error("❌ Error finding chat sessions:", error)
            console.error(`[v0] Error details:`, error.message)
          }
        }

        currentEmployee = null
        currentChatSession = null
        console.log("👨‍💼 Admin disconnected")
      }
    })

    ws.on("error", (error) => {
      console.error("❌ WebSocket error:", error)
    })
  })

  console.log("✅ WebSocket server setup completed")
  return wss
}
