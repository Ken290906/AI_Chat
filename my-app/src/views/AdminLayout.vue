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
          // --- THAY ĐỔI: BỎ addOrUpdateClient KHỎI ĐÂY ---
          // const client = await this.addOrUpdateClient(data.clientId, true, data.canhBaoId); // <-- XÓA DÒNG NÀY

          // CHỈ LẤY TÊN ĐỂ HIỂN THỊ THÔNG BÁO
          let clientName = `Khách ${data.clientId}`; // Tên tạm thời
          try {
            // Gọi API thủ công để lấy tên
            const response = await axios.get(`http://localhost:3000/api/auth/client/${data.clientId}`);
            clientName = response.data.HoTen; // Lấy tên thật
          } catch (error) {
             console.error("❌ (AdminLayout) Error fetching client name for notification:", error);
          }
          // --- KẾT THÚC THAY ĐỔI ---

          // Show toast
          this.$refs.toastRef.show(
            `Khách hàng ${clientName} cần hỗ trợ.`, // Dùng tên vừa fetch
            'warning', // type
            'Yêu cầu hỗ trợ mới' // title
          );
          // Add to notification center
          this.notifications.unshift({
            id: `req_${data.clientId}_${Date.now()}`,
            type: 'support_request',
            clientId: data.clientId,
            canhBaoId: data.canhBaoId, // <-- LƯU LẠI CanhBaoID
            clientName: clientName, // Dùng tên vừa fetch
            avatar: `https://i.pravatar.cc/40?u=${data.clientId}`,
            time: new Date(),
            is_read: false,
          });
        }

        if (data.type === "client_message") {
          // Luôn gọi addOrUpdateClient để cập nhật tên fallback nếu có
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

        // Xử lý khi có admin KHÁC chấp nhận yêu cầu
        if (data.type === "request_claimed") {
          
          console.log(`📢 (AdminLayout) Thu hồi thông báo có canhBaoId: ${data.canhBaoId}`);
          
          // 1. Thu hồi thông báo (Bạn đã có)
          this.notifications = this.notifications.filter(
            noti => noti.canhBaoId !== data.canhBaoId
          );

          // 2. [THÊM MỚI] Thu hồi client khỏi danh sách NẾU không phải mình chấp nhận
          if (data.acceptedByEmployeeId !== this.employee.MaNV) {
            console.log(`🔹 (AdminLayout) Xóa client ${data.clientId} khỏi danh sách vì NV khác đã nhận.`);
            this.clients = this.clients.filter(c => c.id !== data.clientId);
          }
        }
      };
    },

    async addOrUpdateClient(clientId, hasRequest = false, canhBaoId = null) {
      // 1. Kiểm tra xem client đã có trong danh sách chưa
      let client = this.clients.find((c) => c.id === clientId);

      if (!client) {
        // --- CLIENT CHƯA TỒN TẠI ---
        // Tiến hành fetch thông tin
        let newClientData;
        try {
          const response = await axios.get(`http://localhost:3000/api/auth/client/${clientId}`);
          newClientData = { 
            id: clientId, 
            name: response.data.HoTen, // Lấy tên thật
            hasRequest: hasRequest,
            canhBaoId: canhBaoId 
          };
        } catch (error) {
          // API lỗi, tạo tên fallback
          console.error("❌ (AdminLayout) Error fetching client info:", error);
          const fallbackData = { id: clientId, name: `Khách ${clientId}`}; // Tên fallback
          newClientData = {
            ...fallbackData,
            hasRequest: hasRequest,
            canhBaoId: canhBaoId
          };
        }
        
        // Thêm vào danh sách (Đây là nơi duy nhất 'push')
        this.clients.push(newClientData);
        return newClientData; // Trả về client mới

      } else {
        // --- CLIENT ĐÃ TỒN TẠI ---
        
        // Cập nhật trạng thái yêu cầu
        if (hasRequest) {
          client.hasRequest = true;
          client.canhBaoId = canhBaoId;
        }

        // --- SỬA LỖI TÊN FALLBACK ---
        // Nếu tên hiện tại là tên fallback, thử fetch lại tên thật
        if (client.name.startsWith(`Khách `)) {
          console.log(`🔹 (AdminLayout) Client ${clientId} đang dùng tên fallback. Thử fetch lại...`);
          try {
            const response = await axios.get(`http://localhost:3000/api/auth/client/${clientId}`);
            if (response.data.HoTen) {
              console.log(`✅ Cập nhật tên cho ${clientId} thành: ${response.data.HoTen}`);
              client.name = response.data.HoTen; // Cập nhật tên thật
            }
          } catch (error) {
            console.error(`❌ Vẫn lỗi khi fetch tên cho ${clientId}. Giữ tên fallback.`);
          }
        }
        return client; // Trả về client đã cập nhật
      }
    },

    async handleAcceptRequest(notification) {
      const client = await this.addOrUpdateClient(
        notification.clientId,
        false, // hasRequest (sẽ được cập nhật ngay sau đây)
        notification.canhBaoId
      );
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
