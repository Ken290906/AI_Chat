<template>
  <div class="client-chat-container d-flex flex-column" style="height: 100vh; width: 100vw;">
    <!-- Chat Header -->
    <div class="chat-header p-3 border-bottom d-flex align-items-center">
      <img src="https://i.pravatar.cc/40?u=at" class="rounded-circle me-3" alt="AT">
      <div>
        <h6 class="mb-0 fw-bold">AT</h6>
        <small class="text-muted">Nhân viên bán hàng</small>
      </div>
    </div>

    <!-- Chat Body -->
    <div class="chat-body flex-grow-1 p-3 overflow-auto">
      <div v-for="(message, index) in messages" :key="index" :class="['mb-3', message.isUser ? 'd-flex justify-content-end' : 'd-flex justify-content-start']">
        <!-- Agent Message -->
        <template v-if="!message.isUser">
          <img src="https://i.pravatar.cc/32?u=agent" class="rounded-circle me-2 agent-avatar" alt="Agent">
          <div class="message-content">
            <div class="message-bubble agent-message">
              <VueMarkdown :source="message.text" />
            </div>
            <div class="text-muted small mt-1">
              <i class="bi bi-arrow-clockwise"></i>
            </div>
          </div>
        </template>
        <!-- User Message -->
        <div v-else class="message-bubble user-message">
          {{ message.text }}
        </div>
      </div>
      <!-- Loading Effect -->
      <div v-if="isTyping" class="d-flex justify-content-start mb-3 loading-message animate__animated animate__fadeIn">
        <img src="https://i.pravatar.cc/32?u=agent" class="rounded-circle me-2 agent-avatar" alt="Agent">
        <div class="message-content">
          <div class="message-bubble agent-message d-flex align-items-center">
            <div class="spinner"></div>
            <span class="ms-2">Đang trả lời...</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Chat Footer (Input Area) -->
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
        <button class="btn btn-outline-secondary border-0" type="button"><i class="bi bi-google"></i></button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import VueMarkdown from 'vue3-markdown-it';

export default {
  name: 'ClientChat',
  components: {
    VueMarkdown // Đăng ký component VueMarkdown
  },
  data() {
    return {
      messages: [
        { text: 'hello', isUser: true },
        { text: 'Dạ chào bạn ạ! Mình có thể hỗ trợ gì cho bạn hôm nay ạ?', isUser: false }
      ],
      newMessage: '',
      isTyping: false
    };
  },
  methods: {
    async sendMessage() {
      if (!this.newMessage.trim()) return; // Không gửi nếu input rỗng

      // Thêm tin nhắn người dùng vào danh sách
      this.messages.push({ text: this.newMessage, isUser: true });
      const messageToSend = this.newMessage; // Lưu tin nhắn trước khi xóa
      this.newMessage = ''; // Xóa input ngay lập tức sau khi lưu tin nhắn

      // Tự động cuộn xuống dưới cùng
      this.$nextTick(() => {
        const chatBody = this.$el.querySelector('.chat-body');
        chatBody.scrollTop = chatBody.scrollHeight;
      });

      this.isTyping = true; // Bật hiệu ứng loading

      try {
        // Gửi yêu cầu tới backend
        const response = await axios.post('http://localhost:3000/api/chat', {
          message: messageToSend
        });

        // Thêm phản hồi từ server vào danh sách tin nhắn
        this.messages.push({ text: response.data.reply, isUser: false });
      } catch (error) {
        console.error('Lỗi khi gửi tin nhắn:', error);
        this.messages.push({ text: 'Đã có lỗi xảy ra, vui lòng thử lại!', isUser: false });
      } finally {
        this.isTyping = false; // Tắt hiệu ứng loading
      }
    }
  }
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
  background-color: #e0f2f7; /* Light blue */
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

.chat-footer .input-group {
  max-width: none;
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

/* Fade-in Animation */
.loading-message {
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Markdown Styling */
:deep(.markdown-body) {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
}

:deep(.markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4, .markdown-body h5, .markdown-body h6) {
  margin: 0.5em 0;
  font-weight: bold;
}

:deep(.markdown-body ul, .markdown-body ol) {
  padding-left: 20px;
  margin: 0.5em 0;
}

:deep(.markdown-body code) {
  background-color: #f1f3f4;
  padding: 2px 4px;
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
}

:deep(.markdown-body pre) {
  background-color: #f1f3f4;
  padding: 10px;
  border-radius: 8px;
  overflow-x: auto;
}

:deep(.markdown-body pre code) {
  background: none;
  padding: 0;
}
</style>