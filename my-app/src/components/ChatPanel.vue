<template>
  <div class="chat-panel container-fluid">
    <div class="row h-100">
      <!-- Conversation List -->
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

      <!-- Chat Window -->
      <div class="col-md-8 d-flex flex-column p-0">
        <div v-if="activeClient" class="chat-header p-3 border-bottom">
          <h6 class="mb-0 fw-bold">{{ activeClient.name }}</h6>
          <small class="text-muted">Online via Website</small>
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
              :class="['d-flex', msg.isAdmin ? 'justify-content-end' : 'justify-content-start', 'mb-3']"
            >
              <div v-if="msg.isAdmin" class="message-bubble user-message">{{ msg.text }}</div>
              <div v-else class="d-flex">
                <img :src="`https://i.pravatar.cc/32?u=${activeClient.id}`" class="rounded-circle me-2" alt="" width="32" height="32">
                <div class="message-bubble agent-message">{{ msg.text }}</div>
              </div>
            </div>
          </template>
        </div>

        <div class="chat-footer p-3">
          <div class="input-group">
            <input
              v-model="newMessage"
              @keyup.enter="sendMessage"
              type="text"
              class="form-control"
              placeholder="Nhập tin nhắn..."
              :disabled="!activeClient"
            />
            <button class="btn btn-primary" type="button" @click="sendMessage" :disabled="!activeClient">
              <i class="bi bi-send-fill"></i> Gửi
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
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
    handleWsMessage(event) {
        const data = JSON.parse(event.data);
        if (data.type === "support_request") {
          // Lấy thông tin khách hàng từ API khi có support request
          console.log("🔔 Nhận được support request với canhBaoId:", data.canhBaoId);
          await this.addOrUpdateClient(data.clientId, true, data.canhBaoId);
          this.$emit("support-request", data.clientId);
        }

        if (data.type === "client_message") {
          await this.addOrUpdateClient(data.clientId);
          if (this.activeClient && this.activeClient.id === data.clientId) {
            this.chatMessages.push({ text: data.message, isAdmin: false });
          }
        }

        // --- THAY ĐỔI HOÀN TOÀN KHỐI NÀY ---
        if (data.type === "request_claimed") {
          console.log(`🔔 Nhận được 'request_claimed' (CB ID: ${data.canhBaoId}) bởi NV: ${data.acceptedByEmployeeId}`);

          // KIỂM TRA: Nếu *tÔI KHÔNG PHẢI* là người chấp nhận
          if (data.acceptedByEmployeeId !== this.employee.MaNV) {
            
            console.log(`🔹 ${data.acceptedByEmployeeName} đã chấp nhận. Xóa khỏi danh sách của tôi.`);
            
            // 1. Xóa client này khỏi mảng 'clients'
            this.clients = this.clients.filter(c => c.id !== data.clientId);

            // 2. (Phòng hờ) Nếu admin này đang mở cửa sổ chat, đóng nó lại
            if (this.activeClient && this.activeClient.id === data.clientId) {
              this.activeClient = null;
              this.chatMessages = [];
            }
            
          } else {
            // Nếu TÔI LÀ người chấp nhận, không làm gì cả, 
            // vì hàm acceptRequest() của tôi đã xử lý UI rồi.
            console.log("🔹 Xác nhận từ server: Tôi đã chấp nhận yêu cầu này.");
          }
        }
        // --- KẾT THÚC THAY ĐỔI ---
      };
    },
    
    async addOrUpdateClient(clientId, hasRequest = false, canhBaoId = null) {
      let client = this.clients.find((c) => c.id === clientId);
      
      if (!client) {
        try {
          // Lấy thông tin khách hàng từ API
          const response = await axios.get(`http://localhost:3000/api/auth/client/${clientId}`);
          console.log("✅ Client data from API:", response.data);
          client = { 
            id: clientId, 
            name: response.data.HoTen, 
            hasRequest: hasRequest ,
            canhBaoId: canhBaoId 
          };
        } catch (error) {
          console.error("❌ Error fetching client info:", error);
          // Fallback với dữ liệu cứng
          const fallbackClients = {
            '1': { id: '1', name: 'Vân A', hasRequest: hasRequest },
            '2': { id: '2', name: 'Thi B', hasRequest: hasRequest }
          };
          const fallbackData = fallbackClients[clientId] || { id: clientId, name: `Khách ${clientId}`};
          client = {
            ...fallbackData,
            hasRequest: hasRequest,
            canhBaoId: canhBaoId // <--- THÊM DÒNG NÀY
          };
        }
        this.clients.push(client);
        console.log("📋 Clients list:", this.clients); // THÊM LOG NÀY
      } else if (hasRequest) {
        client.hasRequest = true;
        client.canhBaoId = canhBaoId;
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

    acceptRequest(client) {
      this.ws.send(JSON.stringify({
        type: "admin_accept_request",
        clientId: client.id,
        employeeId: this.employee.MaNV, // GỬI EMPLOYEE ID
        canhBaoId: client.canhBaoId
      }));
      client.hasRequest = false;
      client.canhBaoId = null;
      this.selectClient(client);
    },

    declineRequest(client) {
      this.ws.send(JSON.stringify({
        type: "admin_decline_request",
        clientId: client.id,
        canhBaoId: client.canhBaoId // <--- (Tùy chọn)Gửi về server để biết từ chối cái nào
      }));
      client.hasRequest = false;
      client.canhBaoId = null; 
    },
    getLastMessage(clientId) {
      // This is for display only, would be better to get from a state manager
      return null;
    },
  },
};
</script>

<style scoped>
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
.chat-body {
  background-color: #f8f9fa;
}
.message-bubble {
  padding: 10px 15px;
  border-radius: 15px;
  max-width: 80%;
}
.user-message {
  background-color: #0d6efd;
  color: white;
  align-self: flex-end;
  border-bottom-right-radius: 5px;
}
.agent-message {
  background-color: #e9ecef;
  color: #212529;
  border-bottom-left-radius: 5px;
}
.chat-footer {
  background-color: #fff;
  border-top: 1px solid #dee2e6;
}
</style>
