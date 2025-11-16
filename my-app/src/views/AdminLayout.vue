<template>
  <div id="app-layout" :class="{'sidebar-collapsed': !isSidebarOpen}">
    <Header 
      :notifications="notifications"
      @accept-request="handleAcceptRequest"
      @mark-as-read="handleMarkAsRead"
    />
    <ToastNotification ref="toastRef" />

    <div class="main-content container-fluid">
      <div class="row flex-nowrap">
        <div class="col-auto p-0 sidebar-wrapper">
          <Sidebar
            :isOpen="isSidebarOpen"
            :activeTab="activeTab"
            @toggle-sidebar="toggleSidebar"
            @selectTab="handleTabSelect" />
        </div>

        <div class="col p-0">
          
          <router-view v-slot="{ Component }">
            <keep-alive include="ChatPanel">
              <component 
                :is="Component"
                :ws="ws"
                :employee="employee"
                :clients="clients"
                :active-client-id="activeClientIdForChat"
                @select-client="setActiveClient"
                @support-request="handleSupportRequest" 
              />
            </keep-alive>
          </router-view>
          </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import Header from '../components/Header.vue'
import Sidebar from '../components/Sidebar.vue'
import ToastNotification from '../components/ToastNotification.vue'

export default {
  name: 'AdminLayout',
  components: {
    Header,
    Sidebar,
    ToastNotification,
  },
  data() {
    return {
      ws: null,
      employee: null,
      clients: [],
      notifications: [],
      activeClientIdForChat: null,
      isSidebarOpen: true,
      activeTab: 'chat'
    }
  },
  mounted() {
    const savedEmployee = localStorage.getItem('employee');
    if (!savedEmployee) {
      this.$router.push('/login');
      return;
    }
    try {
      this.employee = JSON.parse(savedEmployee);
      this.connectWebSocket();
    } catch (error) {
      console.error('Error parsing employee data:', error);
      this.$router.push('/login');
    }
  },
  methods: {
    connectWebSocket() {
      this.ws = new WebSocket("ws://localhost:3000");

      this.ws.onopen = () => {
        console.log("✅ Admin WebSocket connected as:", this.employee.HoTen);
        this.ws.send(JSON.stringify({ 
          type: "admin_register",
          employeeId: this.employee.MaNV
        }));
      };

      this.ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log("WebSocket message received in AdminLayout:", data);

        if (data.type === "support_request") {
          // Thêm canhBaoId vào client object khi có support request
          const client = await this.addOrUpdateClient(data.clientId, true, data.canhBaoId);
          if (client) {
            // Show toast
            this.$refs.toastRef.show(
              `Khách hàng ${client.name || data.clientId} cần hỗ trợ.`,
              'warning', // type
              'Yêu cầu hỗ trợ mới' // title
            );
            // Add to notification center
            this.notifications.unshift({
              id: `req_${data.clientId}_${Date.now()}`,
              type: 'support_request',
              clientId: data.clientId,
              canhBaoId: data.canhBaoId, // <-- LƯU LẠI CanhBaoID
              clientName: client.name || 'Khách mới',
              avatar: `https://i.pravatar.cc/40?u=${data.clientId}`,
              time: new Date(),
              is_read: false,
            });
          }
        }

        if (data.type === "client_message") {
          const client = await this.addOrUpdateClient(data.clientId);
           if (client) {
            this.notifications.unshift({
              id: `msg_${data.clientId}_${Date.now()}`,
              type: 'message',
              clientId: data.clientId,
              name: client.name,
              text: data.message,
              avatar: `https://i.pravatar.cc/40?u=${data.clientId}`,
              time: new Date(),
              is_read: false,
            });
          }
        }
      };
    },

    async addOrUpdateClient(clientId, hasRequest = false, canhBaoId = null) {
      let client = this.clients.find((c) => c.id === clientId);
      if (!client) {
        try {
          const response = await axios.get(`http://localhost:3000/api/auth/client/${clientId}`);
          client = { 
            id: clientId, 
            name: response.data.HoTen,
            hasRequest: hasRequest,
            canhBaoId: canhBaoId // <-- LƯU LẠI CanhBaoID
          };
          this.clients.push(client);
        } catch (error) {
          console.error("Error fetching client info:", error);
          client = { id: clientId, name: `Khách ${clientId}`, hasRequest: hasRequest, canhBaoId: canhBaoId };
          this.clients.push(client);
        }
      } else if (hasRequest) {
        client.hasRequest = true;
        client.canhBaoId = canhBaoId; // <-- CẬP NHẬT CanhBaoID
      }
      return client;
    },

    handleAcceptRequest(notification) {
      const client = this.clients.find(c => c.id === notification.clientId);
      if (client) {
        this.ws.send(JSON.stringify({
          type: "admin_accept_request",
          clientId: client.id,
          employeeId: this.employee.MaNV,
          canhBaoId: notification.canhBaoId // <-- GỬI ĐI CanhBaoID
        }));
        client.hasRequest = false;
        
        // Remove notification from list
        this.notifications = this.notifications.filter(n => n.id !== notification.id);
        
        // Navigate to chat and set active client
        this.activeClientIdForChat = client.id;
        this.$router.push({ name: 'Chat' }).catch(err => {
            if (err.name !== 'NavigationDuplicated') {
                console.error(err);
            }
        });
      }
    },
    
    handleMarkAsRead(notificationId) {
      const notification = this.notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.is_read = true;
      }
    },

    setActiveClient(client) {
        this.activeClientIdForChat = client.id;
    },

    toggleSidebar() {
      this.isSidebarOpen = !this.isSidebarOpen;
    },

    handleTabSelect(tab) {
      this.activeTab = tab;
      if (this.$route.name?.toLowerCase() !== tab) {
          this.$router.push({ name: tab.charAt(0).toUpperCase() + tab.slice(1) });
      }
    },

    // Hàm này giờ sẽ được kích hoạt bởi @support-request
    handleSupportRequest(clientId) {
      console.log(`Layout: Nhận được yêu cầu hỗ trợ từ ${clientId}`);
      if (this.$refs.toastRef) {
        this.$refs.toastRef.show(`📢 Khách hàng ${clientId} cần hỗ trợ!`, 'warning', 'Cảnh báo mới');
      } else {
        console.warn('ToastNotification chưa sẵn sàng!');
      }
    }
  }
}
</script>

<style>
:root {
  --primary-color: #4A55A2;
  --accent-color: #C5DFF8;
  --background-color: #F8F9FA;
  --sidebar-bg: #FFFFFF;
  --text-color: #343a40;
  --border-color: #dee2e6;
}
body {
  overflow: hidden;
  background-color: var(--background-color);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
/* ... (toàn bộ CSS cũ của bạn) ... */
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--text-color);
}
.main-content, .main-content .row {
  height: calc(100vh - 70px); /* Adjusted for header height */
}
.sidebar-wrapper {
  transition: width 0.3s ease;
  width: 220px;
  flex-shrink: 0;
}
#app-layout.sidebar-collapsed .sidebar-wrapper {
  width: 70px;
}
.main-content .row > div {
  height: 100%;
  overflow-y: auto;
}
.main-content .row.h-100 {
  margin: 0;
}
.main-content .row.h-100 > div {
  height: 100%;
}
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 8px;
  border: 2px solid var(--background-color);
}
::-webkit-scrollbar-thumb:hover {
  background: #aaa;
}
</style>
