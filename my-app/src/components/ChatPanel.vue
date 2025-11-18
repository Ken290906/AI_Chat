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
                {{ getLastMessage(client.id) || 'Chưa có tin nhắn' }}
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
              v-for="(msg, idx) in chatMessages"
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
      chatMessages: [],
      newMessage: "",
    };
  },
  watch: {
    activeClientId: {
      immediate: true,
      handler(newId) {
        if (newId) {
          this.activeClient = this.clients.find(c => c.id === newId);
          this.loadMessageHistory(); // You would load history here
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
        
        // 1. Chỉ xử lý tin nhắn client (để cập nhật cửa sổ chat)
        if (data.type === "client_message") {
          if (this.activeClient && this.activeClient.id === data.clientId) {
            this.chatMessages.push({ text: data.message, isAdmin: false });
          }
        }

        // 2. Xử lý khi admin khác "claim" mất client
        if (data.type === "request_claimed") {
          // Kiểm tra xem có phải TÔI đang xem client đó không
          if (this.activeClient && this.activeClient.id === data.clientId) {
            // Và người claim KHÔNG PHẢI là tôi
            if (data.acceptedByEmployeeId !== this.employee.MaNV) {
              console.log(`🔹 (ChatPanel) ${data.acceptedByEmployeeName} đã chấp nhận. Tự động đóng cửa sổ chat này.`);
              // Đóng cửa sổ chat (reset local state)
              this.activeClient = null;
              this.chatMessages = [];
            }
          }
        }
    },
    
    selectClient(client) {
      this.$emit('select-client', client);
    },
    loadMessageHistory() {
      // In a real app, you'd fetch this from an API
      this.chatMessages = []; 
    },
    sendMessage() {
      if (!this.newMessage.trim() || !this.activeClient || !this.ws) return;
      
      const text = this.newMessage.trim();
      this.chatMessages.push({ text, isAdmin: true });
      this.ws.send(
        JSON.stringify({
          type: "admin_message",
          clientId: this.activeClient.id,
          message: text,
        })
      );
      this.newMessage = "";
    },
    
    getLastMessage(clientId) {
      // This is for display only, would be better to get from a state manager
      return null;
    },
  },
};
</script>

<style scoped>
/* Định nghĩa các biến CSS (nếu chưa có trong file CSS chung) */
:root {
  --primary-color: #4A55A2; /* Màu xanh đậm */
  --background-color: #f0f2f5; /* Nền xám nhạt */
  --sidebar-bg: #ffffff; /* Nền sidebar/header trắng */
  --border-color: #dee2e6; /* Màu đường viền */
}

.chat-panel, .row {
  height: 100%;
}

/* --- Style cho danh sách (Giữ nguyên) --- */
.list-group-item.active {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}
.list-group-item.active .text-muted {
    color: rgba(255, 255, 255, 0.7) !important;
}

/* --- Style Header (Mới, từ ClientChat) --- */
.chat-header {
  background-color: var(--sidebar-bg); /* Nền trắng */
  height: 70px; /* Chiều cao cố định */
}

/* --- Style Body (Cập nhật) --- */
.chat-body {
  background-color: var(--background-color); /* Nền xám nhạt */
}

/* --- Animation (Mới, từ ClientChat) --- */
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

/* --- Message Bubbles (Cập nhật & Đảo ngược) --- */
.message-bubble {
  padding: 12px 20px; /* Kích thước padding */
  border-radius: 20px; /* Bo tròn */
  max-width: 75%; /* Chiều rộng tối đa */
  line-height: 1.5; /* Khoảng cách dòng */
  font-size: 0.95rem; /* Kích thước font */
  word-wrap: break-word; /* Tự động xuống dòng */
}

/* Tin nhắn Admin (Phải) - Dùng style agent-message của ClientChat */
/* Đổi màu: Admin là màu xanh gradient */
.user-message {
  background: linear-gradient(to right, #4A55A2, #7895CB); /* Gradient xanh đậm */
  color: white;
  border-bottom-right-radius: 5px; /* Bo góc dưới bên phải ít hơn */
}

/* Tin nhắn Client (Trái) - Dùng style user-message của ClientChat */
/* Đổi màu: Khách là màu xám */
.agent-message {
  background-color: #e9ecef; /* Nền xám nhạt */
  color: #333; /* Màu chữ đen */
  border-bottom-left-radius: 5px; /* Bo góc dưới bên trái ít hơn */
}

/* --- Chat Footer (Mới, từ ClientChat) --- */
.chat-footer {
  background-color: var(--sidebar-bg); /* Nền trắng */
  border-top: 1px solid var(--border-color); /* Viền trên */
  padding: 1rem 1.5rem 1.5rem 1.5rem; /* Padding */
}

.chat-footer .input-group {
  align-items: center; /* Căn giữa theo chiều dọc */
}

.chat-footer .form-control {
  background-color: var(--background-color); /* Nền input xám nhạt */
  border-radius: 1rem !important; /* Bo tròn mạnh */
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  border: 0; /* Bỏ viền */
  padding: 0.75rem 1rem; /* Padding input */
}

.chat-footer .form-control:focus {
  box-shadow: 0 0 0 0.25rem rgba(74, 85, 162, 0.25); /* Hiệu ứng focus */
  border-color: var(--primary-color);
}

.btn-outline-secondary.border-0 {
  color: #6c757d; /* Màu icon */
}

.btn-primary-custom {
  background-color: var(--primary-color); /* Màu nền nút gửi */
  color: white; /* Màu chữ/icon nút gửi */
  border-radius: 50% !important; /* Nút hình tròn */
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
  margin-left: 8px; /* Khoảng cách với input */
  border: none; /* Bỏ viền */
}

.btn-primary-custom:hover {
  background-color: #3a448a; /* Màu hover */
}
</style>