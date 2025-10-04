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
    <div class="chat-body flex-grow-1 p-3 overflow-auto">
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
          placeholder="Nhập câu hỏi của bạn tại đây..."
        >
        <button class="btn btn-outline-secondary border-0" type="button"><i class="bi bi-mic-fill"></i></button>
        <button class="btn btn-outline-secondary border-0" type="button"><i class="bi bi-send-fill" @click="sendMessage"></i></button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import VueMarkdown from "vue3-markdown-it";

export default {
  name: "ClientChat",
  components: { VueMarkdown },
  data() {
    return {
      ws: null,
      clientId: Math.random().toString(36).substring(2, 9),
      messages: [
        { text: "Xin chào! Mình có thể giúp gì cho bạn hôm nay?", isUser: false },
      ],
      newMessage: "",
      isTyping: false,
      isAdminChat: false, // false = AI mode, true = Admin mode
    };
  },
  mounted() {
    this.connectWebSocket();
  },
  methods: {
    connectWebSocket() {
      this.ws = new WebSocket("ws://localhost:3000");

      this.ws.onopen = () => {
        this.ws.send(JSON.stringify({ type: "client_register", clientId: this.clientId }));
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "admin_message") {
          this.messages.push({ text: data.message, isUser: false });
        }
      };
    },

    async sendMessage() {
      if (!this.newMessage.trim()) return;
      const text = this.newMessage.trim();
      this.messages.push({ text, isUser: true });
      this.newMessage = "";

      // Kiểm tra keyword chuyển chế độ
      if (this.containsSupportKeyword(text)) {
        this.isAdminChat = true;
        this.ws.send(JSON.stringify({ type: "support_request", clientId: this.clientId }));
        this.messages.push({
          text: "📞 Hệ thống đang kết nối bạn với nhân viên hỗ trợ...",
          isUser: false,
        });
        return;
      }

      // Nếu đang chat với Admin
      if (this.isAdminChat) {
        this.ws.send(
          JSON.stringify({
            type: "client_message",
            clientId: this.clientId,
            message: text,
          })
        );
        return;
      }

      // Mặc định chat với AI
      this.isTyping = true;
      try {
        const response = await axios.post("http://localhost:3000/api/chat", { message: text });
        this.messages.push({ text: response.data.reply, isUser: false });
      } catch (error) {
        this.messages.push({ text: "❌ Lỗi khi gửi tin nhắn tới AI.", isUser: false });
      } finally {
        this.isTyping = false;
      }
    },

    containsSupportKeyword(text) {
      const keywords = ["hỗ trợ gấp", "liên hệ nhân viên", "gặp nhân viên", "cần hỗ trợ"];
      return keywords.some((kw) => text.toLowerCase().includes(kw));
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
  max-width: 75%;
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
