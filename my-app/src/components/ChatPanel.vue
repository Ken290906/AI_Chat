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
              <p class="mb-1 small text-muted text-truncate">
                {{ getLastMessage(client.id) }}
              </p>
            </div>
          </a>
        </div>
      </div>

      <div class="col-md-8 d-flex flex-column p-0">
        <div v-if="activeClient" class="chat-header p-3 border-bottom d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center">
             <img 
              :src="`https://i.pravatar.cc/40?u=${activeClient.id}`" 
              class="rounded-circle me-3" 
              :alt="activeClient.name"
              style="width: 40px; height: 40px; object-fit: cover;"
            >
            <div>
              <h6 class="mb-0 fw-bold">{{ activeClient.name }}</h6>
            </div>
          </div>
          
          <button class="btn btn-sm btn-outline-secondary" @click="loadFullHistory(activeClient.id)">
            <i class="bi bi-clock-history"></i> Lịch sử tin nhắn
          </button>
        </div>

        <div class="chat-body flex-grow-1 p-4 overflow-auto" ref="chatBody">
          <div v-if="!activeClient" class="d-flex h-100 align-items-center justify-content-center text-muted">
            <div>
              <i class="bi bi-chat-dots fs-1"></i>
              <p>Chọn một hội thoại để bắt đầu</p>
            </div>
          </div>

          <template v-else>
             <div v-if="isLoadingHistory" class="text-center mb-3">
               <small class="text-muted"><i class="bi bi-arrow-clockwise spin"></i> Đang tải dữ liệu cũ...</small>
            </div>

            <div
              v-for="(msg, idx) in activeChatMessages"
              :key="idx"
              :class="['d-flex', msg.isAdmin ? 'justify-content-end' : 'justify-content-start', 'mb-3', 'message-animation']"
            >
              <template v-if="msg.isAdmin">
                <div class="d-flex flex-column align-items-end" style="max-width: 75%;">
                  
                  <small v-if="msg.isBot" class="text-muted mb-1 me-2 fst-italic" style="font-size: 0.7rem;">
                    <i class="bi bi-robot"></i> AI Trợ lý (Phiên trước)
                  </small>

                  <div 
                    class="message-bubble"
                    :class="msg.isBot ? 'bot-message' : 'user-message'"
                  >
                    {{ msg.text }}
                  </div>
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
      allConversations: {}, 
      newMessage: "",
      isLoadingHistory: false,
      historyLoadedMap: {}, // Đánh dấu khách nào đã load lịch sử rồi
    };
  },
  computed: {
    activeChatMessages() {
      if (!this.activeClient) return [];
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
          if (this.activeClient) {
             // Gọi hàm load lịch sử khi chọn khách
             this.loadMessageHistory(newId, this.activeClient.sessionId);
          }
        } else {
          this.activeClient = null;
        }
      }
    },
    ws: {
        immediate: true,
        handler(newWs) {
            if (newWs) newWs.addEventListener('message', this.handleWsMessage);
        }
    }
  },
  beforeUnmount() {
    if (this.ws) this.ws.removeEventListener('message', this.handleWsMessage);
  },
  methods: {
    async handleWsMessage(event) {
        const data = JSON.parse(event.data);
        if (data.type === "client_message") {
          const clientId = data.clientId;
          if (!this.allConversations[clientId]) this.allConversations[clientId] = [];
          this.allConversations[clientId].push({ 
              text: data.message, 
              isAdmin: false,
              isBot: false
          });
          this.scrollToBottom();
        }
        // Handle request_claimed...
    },
    
    selectClient(client) {
      this.$emit('select-client', client);
    },

    // === 1. HÀM LẤY LỊCH SỬ PHIÊN LIỀN KỀ (QUAN TRỌNG) ===
    async loadMessageHistory(clientId, currentSessionId) {
      // Nếu đã load rồi thì thôi, tránh spam API
      if (this.historyLoadedMap[clientId]) return;
      
      // Nếu chưa có mảng hội thoại thì khởi tạo
      if (!this.allConversations[clientId]) {
        this.allConversations[clientId] = [];
      }

      this.isLoadingHistory = true;
      try {
        // Gọi API Backend vừa tạo ở Bước 2
        // Lưu ý: Sửa lại URL localhost nếu cổng của bạn khác
        const response = await axios.get(`http://localhost:3000/api/chat/history/previous`, {
            params: {
                clientId: clientId,
                currentSessionId: currentSessionId || 0 // Gửi ID phiên hiện tại lên để loại trừ
            }
        });

        const rawMessages = response.data; 

        // Map dữ liệu DB sang Vue
        const formattedMessages = rawMessages.map(msg => {
            // NguoiGui trong DB là: 'HeThong', 'NhanVien', 'KhachHang'
            const isSystem = msg.NguoiGui === 'HeThong';
            const isEmployee = msg.NguoiGui === 'NhanVien';
            
            return {
                text: msg.NoiDung,
                isAdmin: isSystem || isEmployee, // Cả Bot và NV đều nằm bên phải
                isBot: isSystem,                 // Cờ riêng để tô màu xám
                createdAt: msg.ThoiGianGui
            };
        });

        // Nối lịch sử vào ĐẦU mảng tin nhắn hiện tại
        this.allConversations[clientId] = [...formattedMessages, ...this.allConversations[clientId]];
        
        this.historyLoadedMap[clientId] = true; // Đánh dấu đã load
        this.scrollToBottom();

      } catch (error) {
        console.error("Lỗi tải lịch sử:", error);
      } finally {
        this.isLoadingHistory = false;
      }
    },

    // === 2. HÀM LẤY TOÀN BỘ LỊCH SỬ ===
    async loadFullHistory(clientId) {
        if(!confirm("Tải toàn bộ lịch sử chat của khách hàng này?")) return;
        
        try {
            const response = await axios.get(`http://localhost:3000/api/chat/history/full/${clientId}`);
            const rawMessages = response.data;
            
            const formattedMessages = rawMessages.map(msg => ({
                text: msg.NoiDung,
                isAdmin: msg.NguoiGui !== 'KhachHang',
                isBot: msg.NguoiGui === 'HeThong',
                createdAt: msg.ThoiGianGui
            }));

            // Ghi đè toàn bộ để xem full
            this.allConversations[clientId] = formattedMessages;
            this.scrollToBottom();
        } catch (e) {
            console.error("Lỗi full history:", e);
        }
    },

    sendMessage() {
      if (!this.newMessage.trim() || !this.activeClient || !this.ws) return;
      const text = this.newMessage.trim();
      const clientId = this.activeClient.id;

      this.allConversations[clientId].push({ text, isAdmin: true, isBot: false });
      
      this.ws.send(JSON.stringify({
        type: "admin_message",
        clientId: clientId,
        message: text,
      }));
      this.newMessage = "";
      this.scrollToBottom();
    },
    
    getLastMessage(clientId) {
      const conversation = this.allConversations[clientId];
      if (!conversation || conversation.length === 0) return 'Chưa có tin nhắn';
      const lastMsg = conversation[conversation.length - 1];
      return lastMsg.isAdmin ? `Bạn: ${lastMsg.text}` : lastMsg.text;
    },

    scrollToBottom() {
        this.$nextTick(() => {
            const container = this.$refs.chatBody;
            if (container) container.scrollTop = container.scrollHeight;
        });
    }
  },
};
</script>

<style scoped>
/* Giữ nguyên CSS cũ */
:root { --primary-color: #4A55A2; --background-color: #f0f2f5; --sidebar-bg: #ffffff; --border-color: #dee2e6; }
.chat-panel, .row { height: 100%; }
.list-group-item.active { background-color: var(--primary-color); color: white; border-color: var(--primary-color); }
.chat-header { background-color: var(--sidebar-bg); height: 70px; }
.chat-body { background-color: var(--background-color); }
.message-bubble { padding: 12px 20px; border-radius: 20px; max-width: 75%; line-height: 1.5; font-size: 0.95rem; word-wrap: break-word; }
.user-message { background: linear-gradient(to right, #4A55A2, #7895CB); color: white; border-bottom-right-radius: 5px; }
.agent-message { background-color: #e9ecef; color: #333; border-bottom-left-radius: 5px; }
.chat-footer { background-color: var(--sidebar-bg); border-top: 1px solid var(--border-color); padding: 1rem 1.5rem 1.5rem 1.5rem; }
.chat-footer .form-control { background-color: var(--background-color); border-radius: 1rem !important; border: 0; padding: 0.75rem 1rem; }
.btn-primary-custom { background-color: var(--primary-color); color: white; border-radius: 50% !important; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; margin-left: 8px; border: none; }

/* === CSS MỚI CHO BOT === */
.bot-message {
  /* Màu xám cho AI để phân biệt với Admin */
  background: linear-gradient(to right, #6c757d, #adb5bd); 
  color: white;
  border-bottom-right-radius: 5px;
}
</style>