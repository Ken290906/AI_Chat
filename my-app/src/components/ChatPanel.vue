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
        if (data.type === "client_message" && this.activeClient && data.clientId === this.activeClient.id) {
            this.chatMessages.push({ text: data.message, isAdmin: false });
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
      
      this.ws.send(JSON.stringify({
        type: "admin_message",
        clientId: this.activeClient.id,
        message: text,
      }));
      
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
