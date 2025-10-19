<template>
  <div class="chat-panel container-fluid">
    <div class="row h-100">
      <!-- Conversation List -->
      <div class="col-md-4 border-end p-0 d-flex flex-column">
        <div class="p-3 border-bottom">
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="mb-0 fw-bold">Hội thoại</h5>
            <button class="btn btn-sm btn-outline-secondary border-0">
              <i class="bi bi-filter"></i> Bộ lọc
            </button>
          </div>
          <div class="input-group mt-3">
            <span class="input-group-text bg-light border-0"><i class="bi bi-search"></i></span>
            <input type="text" class="form-control bg-light border-0" id="chatSearchInput" placeholder="Tìm kiếm...">
          </div>
        </div>

        <!-- Danh sách hội thoại -->
        <div class="list-group list-group-flush overflow-auto flex-grow-1">
          <a
            v-for="client in clients"
            :key="client.id"
            href="#"
            class="list-group-item list-group-item-action"
            :class="{ active: activeClient && activeClient.id === client.id }"
            @click.prevent="!client.hasRequest && selectClient(client)"
          >
            <div v-if="!client.hasRequest">
              <div class="d-flex w-100 justify-content-between">
                <h6 class="mb-1">{{ client.id || 'Khách mới' }}</h6>
                <small class="text-muted">online</small>
              </div>
              <p class="mb-1 small text-muted">
                {{ getLastMessage(client.id) || 'Chưa có tin nhắn' }}
              </p>
            </div>

            <!-- Support Request Actions -->
            <div v-if="client.hasRequest" class="support-request-actions">
              <h6 class="mb-1 fw-bold">{{ client.id || 'Khách mới' }}</h6>
              <p class="mb-2 small text-danger-emphasis">🚨 Cần hỗ trợ gấp!</p>
              <div class="d-flex justify-content-around">
                <button class="btn btn-sm btn-success" @click.stop="acceptRequest(client)">Đồng ý</button>
                <button class="btn btn-sm btn-secondary" @click.stop="declineRequest(client)">Từ chối</button>
              </div>
            </div>
          </a>
        </div>
      </div>

      <!-- Chat Window -->
      <div class="col-md-8 d-flex flex-column p-0">
        <div class="chat-header p-3 border-bottom d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-0 fw-bold">{{ activeClient ? activeClient.id : 'Chưa xác thực' }}</h6>
            <small class="text-muted" v-if="activeClient">Online via Website</small>
          </div>
        </div>

        <div class="chat-body flex-grow-1 p-4 overflow-auto">
          <div
            v-if="!activeClient"
            class="alert alert-info small d-flex align-items-center justify-content-center"
          >
            <i class="bi bi-info-circle-fill me-2"></i>
            Chưa chọn khách hàng nào để chat.
          </div>

          <template v-else>
            <div
              v-for="(msg, idx) in chatMessages"
              :key="idx"
              :class="['d-flex', msg.isAdmin ? 'justify-content-end' : 'justify-content-start', 'mb-3', 'message-animation']"
            >
              <template v-if="msg.isAdmin">
                <div class="message-bubble user-message">{{ msg.text }}</div>
              </template>
              <template v-else>
                <img
                  src="https://i.pravatar.cc/32?u=agent"
                  alt=""
                  width="32"
                  height="32"
                  class="rounded-circle me-2"
                />
                <div class="message-bubble agent-message">
                  {{ msg.text }}
                  <div class="text-end text-white-50 small mt-1">
                    {{ formatTime() }}
                  </div>
                </div>
              </template>
            </div>
          </template>
        </div>

        <!-- Input -->
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
              placeholder="Nhập tin nhắn của bạn..."
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
export default {
  name: "ChatPanel",
  data() {
    return {
      ws: null,
      clients: [],
      activeClient: null,
      chatMessages: [],
      newMessage: "",
    };
  },
  mounted() {
    this.connectWebSocket();
  },
  methods: {
    connectWebSocket() {
      const backendHost = window.location.hostname.replace('-5173', '-3000');
      const wsUrl = `wss://${backendHost}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.ws.send(JSON.stringify({ type: "admin_register" }));
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "support_request") {
          this.addOrUpdateClient(data.clientId, true);
          this.$emit("support-request", data.clientId);
        }

        if (data.type === "client_message") {
          this.addOrUpdateClient(data.clientId);
          if (this.activeClient && this.activeClient.id === data.clientId) {
            this.chatMessages.push({ text: data.message, isAdmin: false });
          }
        }
      };
    },

    addOrUpdateClient(clientId, hasRequest = false) {
      let client = this.clients.find((c) => c.id === clientId);
      if (!client) {
        client = { id: clientId, hasRequest: hasRequest };
        this.clients.push(client);
      } else if (hasRequest) {
        client.hasRequest = true;
      }
    },

    selectClient(client) {
      if (client.hasRequest) return;
      this.activeClient = client;
      this.chatMessages = []; // reset hoặc có thể load lịch sử
    },

    sendMessage() {
      if (!this.newMessage.trim() || !this.activeClient) return;
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
      }));
      client.hasRequest = false;
      this.selectClient(client);
    },

    declineRequest(client) {
      this.ws.send(JSON.stringify({
        type: "admin_decline_request",
        clientId: client.id,
      }));
      client.hasRequest = false;
    },

    getLastMessage(clientId) {
      const msgs = this.chatMessages.filter(
        (m) => this.activeClient && this.activeClient.id === clientId
      );
      return msgs.length ? msgs[msgs.length - 1].text : null;
    },

    formatTime() {
      const now = new Date();
      return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    },
  },
};
</script>

<style scoped>
.support-request-actions {
  padding: 10px;
  border-radius: 5px;
  text-align: center;
  background-color: #fff3cd;
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

.chat-panel,
.row {
  height: 100%;
  background-color: var(--sidebar-bg);
}
.list-group-item {
  transition: background-color 0.2s ease;
}
.list-group-item.active {
  background-color: var(--accent-color);
  border: none;
}
.list-group-item.active .text-muted {
  color: var(--text-color) !important;
  opacity: 0.8;
}
.chat-body {
  background-color: var(--background-color);
}
.message-animation {
  animation: message-fade-in 0.5s ease-out;
}
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
.chat-footer {
  background-color: var(--sidebar-bg);
  border-top: 1px solid var(--border-color);
  padding: 1rem 1.5rem 1.5rem 1.5rem; /* Adjusted padding */
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
  margin-left: 8px; /* Added margin */
}
.btn-primary-custom:hover {
  background-color: #3a448a;
}
.form-check-input:checked {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}
</style>
