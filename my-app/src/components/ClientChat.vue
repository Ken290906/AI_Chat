<template>
  <div class="client-chat-container d-flex flex-column" style="height: 100vh; width: 100vw;">
    <!-- Chat Header -->
    <div class="chat-header p-3 border-bottom d-flex align-items-center">
      <img 
        :src="getAvatarSource()" 
        class="rounded-circle me-3" 
        :alt="getAgentName()"
        style="width: 40px; height: 40px; object-fit: cover;"
      >
      <div>
        <h6 class="mb-0 fw-bold">
          {{ getAgentName() }}
        </h6>
        <small class="text-muted">
          {{ getAgentRole() }}
        </small>
      </div>
    </div>

    <!-- Chat Body -->
    <div class="chat-body flex-grow-1 p-4 overflow-auto" ref="chatBody">
      <!-- Thông báo kết nối thành công với nhân viên -->
      <div v-if="employeeInfo" class="text-center mb-3">
      </div>

      <!-- TIN NHẮN -->
      <div
        v-for="(message, index) in messages"
        :key="index"
        :class="['d-flex', message.isUser ? 'justify-content-end' : 'justify-content-start', 'mb-3', 'message-animation']"
      >
        <!-- Tin nhắn từ User (khách hàng) -->
        <template v-if="message.isUser">
          <div class="message-bubble user-message">
            {{ message.text }}
            <div class="text-end text-muted small mt-1">
              {{ formatMessageTime(message.timestamp) }}
            </div>
          </div>
        </template>

        <!-- Tin nhắn từ Agent (nhân viên/AI) -->
        <template v-else>
        <img
          :src="getAvatarSource()"
          :alt="getAgentName()"
          width="32"
          height="32"
          class="rounded-circle me-2"
        />
        <div class="message-bubble agent-message">
          {{ message.text }}
          
          <div v-if="employeeInfo && index > 0" class="text-white-50 small mb-1">
            Nhân viên hỗ trợ
          </div>
          
          <div class="text-end text-white-50 small mt-1">
            {{ formatMessageTime(message.timestamp) }}
          </div>
        </div>
      </template>
      </div>

      <!-- Loading Effect -->
      <div v-if="isTyping && !employeeInfo" class="d-flex justify-content-start mb-3 loading-message animate__animated animate__fadeIn">
        <img :src="getAvatarSource()" class="rounded-circle me-2" alt="Agent" width="32" height="32">
        <div class="message-bubble agent-message d-flex align-items-center">
          <div class="spinner"></div>
          <span class="ms-2">Đang trả lời...</span>
        </div>
      </div>
    </div>

    <!-- Chat Footer -->
    <div class="chat-footer">
      <div class="input-group">
        <button class="btn btn-outline-secondary border-0" type="button">
          <i class="bi bi-paperclip fs-5"></i>
        </button>
        <input
          v-model="newMessage"
          @keyup.enter="sendMessage"
          type="text"
          class="form-control border-0"
          :placeholder="getPlaceholderText()"
          :disabled="isAwaitingAdmin"
        />
        <button class="btn btn-primary-custom" type="button" @click="sendMessage" :disabled="isAwaitingAdmin">
          <i class="bi bi-send-fill"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import VueMarkdown from 'vue3-markdown-it'
import { nextTick } from 'vue'; // Import nextTick

export default {
  name: "ClientChat",
  components: {
    VueMarkdown,
  },
  data() {
    return {
      ws: null,
      clientId: null,
      clientInfo: null,
      employeeInfo: null,
      messages: [
        { 
          text: "Xin chào! Mình có thể giúp gì cho bạn hôm nay?", 
          isUser: false, 
          id: 'initial',
          timestamp: new Date()
        },
      ],
      newMessage: "",
      isTyping: false,
      isAdminChat: false,
      promptCount: 0,
      isAwaitingAdmin: false,
      chatSessionId: null, // ID phiên chat hiện tại
    };
  },
  // Xóa watcher trên messages
  // watch: {
  //   messages() {
  //     this.$nextTick(() => {
  //       this.scrollToBottom();
  //     });
  //   }
  // },
  async mounted() {
    const urlParams = new URLSearchParams(window.location.search);
    this.clientId = urlParams.get('clientId') || '1';
    
    await this.fetchClientInfo();
    this.connectWebSocket();
    this.scrollToBottom(true); // Cuộn xuống khi mounted
  },
  methods: {
    getAgentRole() {
      if (this.employeeInfo) {
        return `Nhân viên hỗ trợ`;
      }
      return 'Trợ lý ảo';
    },

     getAvatarSource() {
      if (this.employeeInfo) {
        return `https://i.pravatar.cc/40?u=employee${this.employeeInfo.MaNV}`;
      }
      return 'https://i.pravatar.cc/40?u=ai';
    },

    getAgentName() {
      if (this.employeeInfo) {
        return 'Nhân viên hỗ trợ'; 
      }
      return 'Trợ lý AI (Gemma3)';
    },
    getCurrentChatStatus() {
      console.log("🔄 Chat Status Debug:");
      console.log("  - employeeInfo:", this.employeeInfo);
      console.log("  - isAdminChat:", this.isAdminChat);
      console.log("  - isAwaitingAdmin:", this.isAwaitingAdmin);
      console.log("  - Agent Name:", this.getAgentName());
      console.log("  - Agent Role:", this.getAgentRole());
    },

    getPlaceholderText() {
      if (this.isAwaitingAdmin) {
        return 'Đang chờ nhân viên hỗ trợ...';
      } else if (this.isAdminChat && this.employeeInfo) {
        return `Nhắn tin với Nhân viên hỗ trợ...`;
      } else {
        return 'Nhập tin nhắn của bạn...';
      }
    },
    
    formatMessageTime(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return date.toLocaleTimeString('vi-VN', { 
        hour: "2-digit", 
        minute: "2-digit" 
      });
    },
    
    async fetchClientInfo() {
      try {
        const response = await axios.get(`http://localhost:3000/api/auth/client/${this.clientId}`);
        this.clientInfo = response.data;
        console.log("✅ Client info loaded:", this.clientInfo);
      } catch (error) {
        console.error("❌ Error fetching client info:", error);
        this.clientInfo = { 
          MaKH: this.clientId, 
          HoTen: `Khách ${this.clientId}` 
        };
      }
    },
    
    // Hàm cuộn thông minh
    scrollToBottom(force = false) {
      nextTick(() => {
        const el = this.$refs.chatBody;
        if (el) {
          const scrollThreshold = 100; // Ngưỡng pixel để xác định người dùng có ở dưới cùng hay không
          const isScrolledUp = el.scrollHeight - el.scrollTop - el.clientHeight > scrollThreshold;
          
          // Nếu `force` là true, hoặc nếu người dùng không cuộn lên, thì cuộn xuống
          if (force || !isScrolledUp) {
            el.scrollTop = el.scrollHeight;
          }
        }
      });
    },
    
    connectWebSocket() {
      this.ws = new WebSocket("ws://localhost:3000");

      this.ws.onopen = () => {
        console.log("✅ WebSocket connected as client:", this.clientId);
        this.isConnected = true;
        this.ws.send(JSON.stringify({ 
          type: "client_register", 
          clientId: this.clientId 
        }));
      },

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("🔍 DEBUG - WebSocket message received:", data);
        console.log("🔍 DEBUG - Current state - isAdminChat:", this.isAdminChat, "employeeInfo:", this.employeeInfo);
        const connectingMsgIndex = this.messages.findIndex(
          (msg) => msg.id === 'connecting_message'
        );

        setTimeout(() => {
          this.getCurrentChatStatus();
        }, 100);

        if (data.type === "agent_accepted") {
          this.isAwaitingAdmin = false;
          this.isAdminChat = true;
          
          if (data.employee) {
            this.employeeInfo = data.employee;
            console.log("✅ Connected with employee:", this.employeeInfo);
            
            this.messages.push({
              text: `✅ Đã kết nối nhân viên hỗ trợ. Bạn có thể bắt đầu trò chuyện!`,
              isUser: false,
              timestamp: new Date()
            });
          }
          
          if (connectingMsgIndex !== -1) {
            this.messages.splice(connectingMsgIndex, 1);
          }
          this.scrollToBottom(true); // Cuộn xuống khi kết nối với nhân viên
        } else if (data.type === "agent_declined") {
          this.isAwaitingAdmin = false;
          if (connectingMsgIndex !== -1) {
            this.messages.splice(connectingMsgIndex, 1, {
              text: data.message,
              isUser: false,
              timestamp: new Date()
            });
          }
          this.isAdminChat = false;
          this.promptCount = 0;
          this.employeeInfo = null;
          this.scrollToBottom(true); // Cuộn xuống khi từ chối
        } else if (data.type === "admin_message") {
          this.messages.push({ 
            text: data.message.trim(), 
            isUser: false,
            timestamp: new Date()
          });
          this.scrollToBottom(false); // Cuộn thông minh khi nhận tin nhắn admin
        }
      };

      this.ws.onclose = () => {
        console.log("⚠️ WebSocket disconnected.");
      };

      this.ws.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
      };
    },

    requestSupport(reason) {
      this.isAdminChat = true;
      this.isAwaitingAdmin = true;
      this.ws.send(JSON.stringify({ 
        type: "support_request", 
        clientId: this.clientId,
        chatSessionId: this.chatSessionId
      }));
      this.messages.push({
        text: reason,
        isUser: false,
        id: 'connecting_message',
        timestamp: new Date()
      });
      this.scrollToBottom(true); // Cuộn xuống khi yêu cầu hỗ trợ
    },

    async sendMessage() {
      if (!this.newMessage.trim() || this.isAwaitingAdmin) return;
      const text = this.newMessage.trim();
      this.messages.push({ 
        text, 
        isUser: true,
        timestamp: new Date()
      });
      this.newMessage = "";
      this.scrollToBottom(true); // Cuộn xuống khi gửi tin nhắn

      if (this.isAdminChat) {
        if (text.toLowerCase() === 'gemma') {
          this.isAdminChat = false;
          this.isAwaitingAdmin = false;
          this.promptCount = 0;
          this.employeeInfo = null;
          this.messages.push({
            text: "🤖 Đã chuyển về chế độ chat với Trợ lý AI.",
            isUser: false,
            timestamp: new Date()
          });
          this.scrollToBottom(true); // Cuộn xuống khi chuyển chế độ
          return;
        }
        this.ws.send(JSON.stringify({ type: "client_message", clientId: this.clientId, message: text }));
        return;
      }

      this.promptCount++;

      if (this.promptCount >= 3) {
        // === BƯỚC QUAN TRỌNG: Gửi tin nhắn text xuống server trước ===
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
           this.ws.send(JSON.stringify({ 
             type: "client_message", 
             clientId: this.clientId, 
             message: text 
           }));
        }
        // =============================================================

        this.requestSupport("⚠️ AI đã gặp lỗi sau 3 lần thử. Hệ thống đang kết nối bạn với nhân viên hỗ trợ...");
        return; 
      }

      if (this.containsSupportKeyword(text)) {
        // === Gửi tin nhắn text xuống server trước ===
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
           this.ws.send(JSON.stringify({ 
             type: "client_message", 
             clientId: this.clientId, 
             message: text 
           }));
        }
        // ============================================
        
        this.requestSupport("📞 Hệ thống đang kết nối bạn với nhân viên hỗ trợ...");
        return;
      }

      this.isTyping = true;
      try {
        const response = await axios.post("http://localhost:3000/api/chat", { 
          chatSessionId: this.chatSessionId,
          clientId: this.clientId,
          message: text });
        this.chatSessionId = response.data.chatSessionId;
        this.messages.push({ 
          text: response.data.reply, 
          isUser: false,
          timestamp: new Date()
        });
        this.scrollToBottom(true); // Cuộn xuống khi nhận phản hồi AI
      } catch (error) {
        this.messages.push({ 
          text: "❌ Lỗi khi gửi tin nhắn tới AI.", 
          isUser: false,
          timestamp: new Date()
        });
        this.scrollToBottom(true); // Cuộn xuống khi có lỗi AI
        this.requestSupport("☠️ AI đang gặp sự cố kỹ thuật. Hệ thống đang kết nối bạn với nhân viên hỗ trợ...");
      } finally {
        this.isTyping = false;
      }
    },

    containsSupportKeyword(text) {
      return text.toLowerCase().includes("nhân viên hỗ trợ");
    },
  },
};
</script>

<style scoped>
.client-chat-container {
  background-color: var(--background-color);
}

.chat-header {
  background-color: white;
  height: 70px;
}

.chat-body {
  background-color: var(--background-color);
  flex: 1;
}

/* Hiệu ứng tin nhắn mới - GIỐNG CHATPANEL */
@keyframes message-fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-animation {
  animation: message-fade-in 0.5s ease-out;
}

/* Bubble tin nhắn - GIỐNG CHATPANEL */
.message-bubble {
  padding: 12px 20px;
  border-radius: 20px;
  max-width: 75%;
  line-height: 1.5;
}

.user-message {
  background-color: #e9ecef;
  color: #333;
  border-bottom-right-radius: 5px;
}

.agent-message {
  background: linear-gradient(to right, #4A55A2, #7895CB);
  color: white;
  border-bottom-left-radius: 5px;
}

/* Chat footer - GIỐNG CHATPANEL */
.chat-footer {
  background-color: var(--sidebar-bg);
  border-top: 1px solid var(--border-color);
  padding: 1rem 1.5rem 1.5rem 1.5rem;
}

.chat-footer .form-control {
  background-color: var(--background-color);
  border-radius: 1rem !important;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.chat-footer .form-control:focus {
  box-shadow: 0 0 0 0.25rem rgba(74, 85, 162, 0.25);
  border-color: var(--primary-color);
}

.btn-primary-custom {
  background-color: var(--primary-color);
  color: white;
  border-radius: 50% !important;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
  margin-left: 8px;
}

.btn-primary-custom:hover {
  background-color: #3a448a;
}

/* Spinner Animation */
.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid #ccc;
  border-top-color: #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.alert {
  max-width: 80%;
  margin: 0 auto;
}

/* CSS Variables từ ChatPanel */
:root {
  --primary-color: #4A55A2;
  --accent-color: #C5DFF8;
  --background-color: #F8F9FA;
  --sidebar-bg: #FFFFFF;
  --text-color: #343a40;
  --border-color: #dee2e6;
}
</style>