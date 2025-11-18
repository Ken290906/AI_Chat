<template>
  <div class="chat-panel container-fluid">
    <div class="row h-100">
      <div class="col-md-4 border-end p-0 d-flex flex-column">
        <div class="p-3 border-bottom">
          <h5 class="mb-0 fw-bold">Hội thoại</h5>
          <div class="input-group mt-3">
            <span class="input-group-text bg-light border-0"><i class="bi bi-search"></i></span>
            <input type="text" class="form-control bg-light border-0" placeholder="Tìm kiếm...">
          </div>
        </div>

        <div class="list-group list-group-flush overflow-auto flex-grow-1">
          <a
            v-for="client in clients"
            :key="client.id"
            href="#"
            class="list-group-item list-group-item-action"
            :class="{ active: activeClient && activeClient.id === client.id }"
            @click.prevent="selectClient(client)"
          >
            <div>
              <div class="d-flex w-100 justify-content-between">
                <h6 class="mb-1">{{ client.name || 'Khách mới' }}</h6>
                <small class="text-muted">online</small>
              </div>
              <p class="mb-1 small text-muted">
                {{ getLastMessage(client.id) }}
              </p>
            </div>
          </a>
        </div>
      </div>

      <div class="col-md-8 d-flex flex-column p-0">
        <div v-if="activeClient" class="chat-header p-3 border-bottom d-flex align-items-center">
          <img 
            :src="`https://i.pravatar.cc/40?u=${activeClient.id}`" 
            class="rounded-circle me-3" 
            :alt="activeClient.name"
            style="width: 40px; height: 40px; object-fit: cover;"
          >
          <div>
            <h6 class="mb-0 fw-bold">{{ activeClient.name }}</h6>
            <small class="text-muted">Online via Website</small>
          </div>
        </div>

        <div class="chat-body flex-grow-1 p-4 overflow-auto">
          <div v-if="!activeClient" class="d-flex h-100 align-items-center justify-content-center text-muted">
            <div>
              <i class="bi bi-chat-dots fs-1"></i>
              <p>Chọn một hội thoại để bắt đầu</p>
            </div>
          </div>

          <template v-else>
            <div
              v-for="(msg, idx) in activeChatMessages"
              :key="idx"
              :class="['d-flex', msg.isAdmin ? 'justify-content-end' : 'justify-content-start', 'mb-3', 'message-animation']"
            >
              <template v-if="msg.isAdmin">
                <div class="message-bubble user-message">
                  {{ msg.text }}
                </div>
              </template>
              
              <template v-else>
                <img :src="`https://i.pravatar.cc/32?u=${activeClient.id}`" class="rounded-circle me-2" alt="" width="32" height="32">
                <div class="message-bubble agent-message">
                  {{ msg.text }}
                </div>
              </template>
            </div>
          </template>
        </div>

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
              placeholder="Nhập tin nhắn..."
              :disabled="!activeClient"
            />
            <button class="btn btn-primary-custom" type="button" @click="sendMessage" :disabled="!activeClient">
              <i class="bi bi-send-fill"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "ChatPanel",
  props: {
    ws: Object,
    employee: Object,
    clients: Array,
    activeClientId: String,
  },
  data() {
    return {
      activeClient: null,
      // SỬA LỖI LOGIC: Dùng 1 object để lưu TẤT CẢ hội thoại
      allConversations: {}, // Ví dụ: { 'client-1': [msg1, msg2], 'client-2': [msg3] }
      newMessage: "",
    };
  },
  // SỬA LỖI LOGIC: Thêm computed property
  computed: {
    /**
     * Tự động trả về mảng tin nhắn của client đang được chọn
     */
    activeChatMessages() {
      if (!this.activeClient) {
        return [];
      }
      // Nếu chưa có mảng tin nhắn cho client này, hãy tạo một mảng rỗng
      if (!this.allConversations[this.activeClient.id]) {
        this.allConversations[this.activeClient.id] = [];
      }
      return this.allConversations[this.activeClient.id];
    }
  },
  watch: {
    activeClientId: {
      immediate: true,
      handler(newId) {
        if (newId) {
          this.activeClient = this.clients.find(c => c.id === newId);
          // SỬA LỖI LOGIC: Truyền Id vào
          this.loadMessageHistory(newId);
        } else {
          this.activeClient = null;
        }
      }
    },
    ws: {
        immediate: true,
        handler(newWs) {
            if (newWs) {
                newWs.addEventListener('message', this.handleWsMessage);
            }
        }
    }
  },
  beforeUnmount() {
    if (this.ws) {
        this.ws.removeEventListener('message', this.handleWsMessage);
    }
  },
  methods: {
    async handleWsMessage(event) {
        const data = JSON.parse(event.data);
        
        // SỬA LỖI LOGIC: Lưu tin nhắn vào đúng mảng hội thoại
        if (data.type === "client_message") {
          const clientId = data.clientId;
          // Đảm bảo mảng tồn tại
          if (!this.allConversations[clientId]) {
             this.allConversations[clientId] = [];
          }
          // Thêm tin nhắn vào mảng của client đó
          this.allConversations[clientId].push({ text: data.message, isAdmin: false });
        }

        // 2. Xử lý khi admin khác "claim" mất client
        if (data.type === "request_claimed") {
          if (this.activeClient && this.activeClient.id === data.clientId) {
            if (data.acceptedByEmployeeId !== this.employee.MaNV) {
              console.log(`🔹 (ChatPanel) ${data.acceptedByEmployeeName} đã chấp nhận. Tự động đóng cửa sổ chat này.`);
              this.activeClient = null;
              // mảng 'allConversations[data.clientId]' vẫn được giữ
              // nhưng 'activeChatMessages' sẽ trả về []
            }
          }
        }
    },
    
    selectClient(client) {
      this.$emit('select-client', client);
    },
    
    // SỬA LỖI LOGIC: Cập nhật hàm này
    loadMessageHistory(clientId) {
      // Trong ứng dụng thật, bạn sẽ gọi API tại đây
      // Ví dụ: this.allConversations[clientId] = await axios.get(...)
      
      // Hiện tại, chúng ta chỉ cần đảm bảo mảng tồn tại
      if (clientId && !this.allConversations[clientId]) {
        this.allConversations[clientId] = [];
      }
      // KHÔNG còn `this.chatMessages = []`
    },
    
    sendMessage() {
      if (!this.newMessage.trim() || !this.activeClient || !this.ws) return;
      
      const text = this.newMessage.trim();
      const clientId = this.activeClient.id;

      // SỬA LỖI LOGIC: Thêm tin nhắn vào đúng mảng hội thoại
      this.allConversations[clientId].push({ text, isAdmin: true });
      
      this.ws.send(
        JSON.stringify({
          type: "admin_message",
          clientId: clientId,
          message: text,
        })
      );
      this.newMessage = "";
    },
    
    // SỬA LỖI LOGIC: Lấy tin nhắn cuối cùng từ 'allConversations'
    getLastMessage(clientId) {
      const conversation = this.allConversations[clientId];
      if (!conversation || conversation.length === 0) {
        return 'Chưa có tin nhắn'; // Trả về tin nhắn mặc định
      }
      // Trả về nội dung text của tin nhắn cuối cùng
      const lastMsg = conversation[conversation.length - 1];
      return lastMsg.isAdmin ? `Bạn: ${lastMsg.text}` : lastMsg.text;
    },
  },
};
</script>

<style scoped>
/* Toàn bộ CSS GIAO DIỆN MỚI của bạn được giữ nguyên */
:root {
  --primary-color: #4A55A2;
  --background-color: #f0f2f5;
  --sidebar-bg: #ffffff;
  --border-color: #dee2e6;
}

.chat-panel, .row {
  height: 100%;
}

.list-group-item.active {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}
.list-group-item.active .text-muted {
    color: rgba(255, 255, 255, 0.7) !important;
}

.chat-header {
  background-color: var(--sidebar-bg);
  height: 70px;
}

.chat-body {
  background-color: var(--background-color);
}

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

.message-bubble {
  padding: 12px 20px;
  border-radius: 20px;
  max-width: 75%;
  line-height: 1.5;
  font-size: 0.95rem;
  word-wrap: break-word;
}

.user-message {
  background: linear-gradient(to right, #4A55A2, #7895CB);
  color: white;
  border-bottom-right-radius: 5px;
}

.agent-message {
  background-color: #e9ecef;
  color: #333;
  border-bottom-left-radius: 5px;
}

.chat-footer {
  background-color: var(--sidebar-bg);
  border-top: 1px solid var(--border-color);
  padding: 1rem 1.5rem 1.5rem 1.5rem;
}

.chat-footer .input-group {
  align-items: center;
}

.chat-footer .form-control {
  background-color: var(--background-color);
  border-radius: 1rem !important;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  border: 0;
  padding: 0.75rem 1rem;
}

.chat-footer .form-control:focus {
  box-shadow: 0 0 0 0.25rem rgba(74, 85, 162, 0.25);
  border-color: var(--primary-color);
}

.btn-outline-secondary.border-0 {
  color: #6c757d;
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
  border: none;
}

.btn-primary-custom:hover {
  background-color: #3a448a;
}
</style>