<template>
  <div class="client-chat-container d-flex flex-column" style="height: 100vh; width: 100vw;">
    <!-- Chat Header -->
    <div class="chat-header p-3 border-bottom d-flex align-items-center">
      <img src="https://i.pravatar.cc/40?u=at" class="rounded-circle me-3" alt="AT">
      <div>
        <h6 class="mb-0 fw-bold">AT</h6>
        <small class="text-muted">
          {{ isAdminChat ? 'Nhân viên hỗ trợ' : 'Trợ lý AI (Gemma3)' }}
        </small>
      </div>
    </div>

    <!-- Chat Body -->
    <div class="chat-body flex-grow-1 p-3 overflow-auto" ref="chatBody">
      <div
        v-for="(message, index) in messages"
        :key="index"
        :class="['mb-3', message.isUser ? 'd-flex justify-content-end' : 'd-flex justify-content-start']"
      >
        <!-- Agent Message -->
        <template v-if="!message.isUser">
          <img src="https://i.pravatar.cc/32?u=agent" class="rounded-circle me-2 agent-avatar" alt="Agent">
          <div class="message-content">
            <div class="message-bubble agent-message">
              <VueMarkdown :source="message.text" />
            </div>
          </div>
        </template>

        <!-- User Message -->
        <div v-else class="message-bubble user-message">{{ message.text }}</div>
      </div>

      <!-- Loading Effect -->
      <div v-if="isTyping && !isAdminChat" class="d-flex justify-content-start mb-3 loading-message animate__animated animate__fadeIn">
        <img src="https://i.pravatar.cc/32?u=agent" class="rounded-circle me-2 agent-avatar" alt="Agent">
        <div class="message-content">
          <div class="message-bubble agent-message d-flex align-items-center">
            <div class="spinner"></div>
            <span class="ms-2">Đang trả lời...</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Chat Footer -->
    <div class="chat-footer p-3 border-top">
      <div class="input-group">
        <button class="btn btn-outline-secondary border-0" type="button"><i class="bi bi-plus-lg"></i></button>
        <input
          v-model="newMessage"
          @keyup.enter="sendMessage"
          type="text"
          class="form-control border-0"
          :placeholder="isAwaitingAdmin ? 'Đang chờ nhân viên hỗ trợ...' : 'Nhập câu hỏi của bạn tại đây...'"
          :disabled="isAwaitingAdmin"
        >
        <button class="btn btn-outline-secondary border-0" type="button"><i class="bi bi-mic-fill"></i></button>
        <button class="btn btn-outline-secondary border-0" type="button" @click="sendMessage" :disabled="isAwaitingAdmin"><i class="bi bi-send-fill"></i></button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import VueMarkdown from 'vue3-markdown-it'

export default {
  name: "ClientChat",
  components: {
    VueMarkdown,
  },
  data() {
    return {
      ws: null,
      clientId: Math.random().toString(36).substring(2, 9),
      messages: [
        { text: "Xin chào! Mình có thể giúp gì cho bạn hôm nay?", isUser: false, id: 'initial' },
      ],
      newMessage: "",
      isTyping: false,
      isAdminChat: false, // false = AI mode, true = Admin mode
      promptCount: 0, // Count user prompts to AI
      isAwaitingAdmin: false, // True when waiting for admin to accept/decline
    };
  },
  watch: {
    messages() {
      this.$nextTick(() => {
        this.scrollToBottom();
      });
    }
  },
  mounted() {
    this.connectWebSocket();
    this.scrollToBottom();
  },
  methods: {
    scrollToBottom() {
      const chatBody = this.$refs.chatBody;
      if (chatBody) {
        chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });
      }
    },
    connectWebSocket() {
      const backendHost = window.location.hostname.replace('-5173', '-3000');
      const wsUrl = `wss://${backendHost}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.ws.send(JSON.stringify({ type: "client_register", clientId: this.clientId }));
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const connectingMsgIndex = this.messages.findIndex(
          (msg) => msg.id === 'connecting_message'
        );

        if (data.type === "agent_accepted") {
          this.isAwaitingAdmin = false;
          this.isAdminChat = true; // Officially in admin chat
          if (connectingMsgIndex !== -1) {
            this.messages.splice(connectingMsgIndex, 1, {
              text: "✅ Nhân viên đã kết nối. Bạn có thể bắt đầu cuộc trò chuyện!",
              isUser: false,
              id: 'connected_confirmation'
            });
          }
        } else if (data.type === "agent_declined") {
          this.isAwaitingAdmin = false;
          if (connectingMsgIndex !== -1) {
            this.messages.splice(connectingMsgIndex, 1, {
              text: data.message, // "Sorry, all agents are busy..."
              isUser: false,
              id: 'declined_confirmation'
            });
          }
          this.isAdminChat = false; // Revert to AI chat mode
          this.promptCount = 0; // Reset counter
        } else if (data.type === "admin_message") {
          this.messages.push({ text: data.message.trim(), isUser: false });
        }
      };
    },

    requestSupport(reason) {
      this.isAdminChat = true; // Tentatively switch to admin mode
      this.isAwaitingAdmin = true;
      this.ws.send(JSON.stringify({ type: "support_request", clientId: this.clientId }));
      this.messages.push({
        text: reason,
        isUser: false,
        id: 'connecting_message',
      });
    },

    async sendMessage() {
      if (!this.newMessage.trim() || this.isAwaitingAdmin) return;
      const text = this.newMessage.trim();
      this.messages.push({ text, isUser: true });
      this.newMessage = "";

      // Handle admin chat logic first
      if (this.isAdminChat) {
        if (text.toLowerCase() === 'gemma') {
          this.isAdminChat = false;
          this.isAwaitingAdmin = false;
          this.promptCount = 0; // Reset counter
          this.messages.push({
            text: "🤖 Đã chuyển về chế độ chat với Trợ lý AI.",
            isUser: false,
            id: 'switched_to_ai'
          });
          return;
        }
        this.ws.send(JSON.stringify({ type: "client_message", clientId: this.clientId, message: text }));
        return;
      }

      // Handle AI chat logic
      this.promptCount++;

      if (this.promptCount >= 3) {
        this.requestSupport("⚠️ AI đã gặp lỗi sau 3 lần thử. Hệ thống đang kết nối bạn với nhân viên hỗ trợ...");
        return;
      }

      if (this.containsSupportKeyword(text)) {
        this.requestSupport("📞 Hệ thống đang kết nối bạn với nhân viên hỗ trợ...");
        return;
      }

      this.isTyping = true;
      try {
        const backendHost = window.location.hostname.replace('-5173', '-3000');
        const httpUrl = `https://${backendHost}`;
        const response = await axios.post(`${httpUrl}/api/chat`, { message: text });
        this.messages.push({ text: response.data.reply, isUser: false });
      } catch (error) {
        this.messages.push({ text: "❌ Lỗi khi gửi tin nhắn tới AI.", isUser: false });
        // Trigger support request on AI error
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
  background-color: #f8f9fa;
}

.chat-header {
  background-color: white;
  height: 70px;
}

.chat-body {
  background-color: #e9ecef;
  flex: 1;
}

.message-bubble {
  padding: 10px 15px;
  border-radius: 1rem;
  max-width: 100%;
  word-wrap: break-word;
}

.user-message {
  background-color: #e0f2f7;
  color: #333;
}

.agent-message {
  background-color: white;
  color: #333;
}

.agent-avatar {
  width: 32px;
  height: 32px;
  object-fit: cover;
  border: 2px solid #e9ecef;
  flex-shrink: 0;
}

.chat-footer {
  background-color: white;
  padding: 20px;
}

.chat-footer .input-group .form-control {
  border-radius: 1rem !important;
  background-color: #f1f3f4;
  padding: 12px 20px;
  font-size: 14px;
}

.chat-footer .input-group .btn {
  border-radius: 1rem !important;
  background-color: #f1f3f4;
  border: none;
  color: #666;
  margin: 0 5px;
}

.chat-footer .input-group .btn:hover {
  background-color: #e1e3e4;
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
</style>
