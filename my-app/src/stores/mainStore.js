import { defineStore } from 'pinia';
import axios from 'axios';
import router from '../router';

export const useMainStore = defineStore('main', {
  state: () => ({
    ws: null,
    employee: null,
    clients: [],
    notifications: [],
    activeClientIdForChat: null,
  }),

  getters: {
    // Example getter
    unreadNotificationsCount: (state) => {
      return state.notifications.filter(n => !n.is_read).length;
    }
  },

  actions: {
    // =================================
    // INITIALIZATION
    // =================================
    initializeStore() {
      const savedEmployee = localStorage.getItem('employee');
      if (!savedEmployee) {
        router.push('/login');
        return;
      }
      try {
        this.employee = JSON.parse(savedEmployee);
        this.connectWebSocket();
        this.fetchNotifications();
      } catch (error) {
        console.error('Error initializing store:', error);
        router.push('/login');
      }
    },

    // =================================
    // NOTIFICATIONS
    // =================================
    async fetchNotifications() {
      try {
        const response = await axios.get("http://localhost:3000/api/thongbao");
        this.notifications = response.data.map(item => ({
          id: item.MaThongBao,
          type: item.NoiDung.includes('hỗ trợ') ? 'support_request' : 'message',
          phienChatId: item.MaPhienChat,
          clientId: item.PhienChat?.MaKH,
          clientName: item.PhienChat?.KhachHang?.HoTen || `Khách ${item.PhienChat?.MaKH}`,
          text: item.NoiDung,
          time: item.ThoiGianTao,
          is_read: item.TrangThai === 'DaDoc',
          avatar: `https://i.pravatar.cc/40?u=${item.PhienChat?.MaKH}`,
        }));
        console.log("✅ [Store] Fetched initial notifications");
      } catch (error) {
        console.error("❌ [Store] Error fetching initial notifications:", error);
      }
    },

    async markAsRead(notificationId) {
      const notification = this.notifications.find(n => n.id === notificationId);
      if (notification && !notification.is_read) {
        try {
          await axios.put(`http://localhost:3000/api/thongbao/${notificationId}/read`);
          notification.is_read = true;
          console.log(`✅ [Store] Marked notification ${notificationId} as read.`);
        } catch (error) {
          console.error(`❌ [Store] Error marking notification ${notificationId} as read:`, error);
        }
      }
    },

    // =================================
    // WEBSOCKET
    // =================================
    connectWebSocket() {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log("🔹 [Store] WebSocket connection already open.");
        return;
      }
      this.ws = new WebSocket("ws://localhost:3000");

      this.ws.onopen = () => {
        console.log("✅ [Store] Admin WebSocket connected as:", this.employee.HoTen);
        this.ws.send(JSON.stringify({ 
          type: "admin_register",
          employeeId: this.employee.MaNV
        }));
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("📨 [Store] WebSocket message received:", data);

        if (data.type === "new_message_notification") {
          const newNoti = data.notification;
          this.notifications.unshift({
            id: newNoti.MaThongBao,
            type: 'message',
            phienChatId: newNoti.MaPhienChat,
            clientId: newNoti.MaPhienChat,
            name: `Tin nhắn mới`,
            text: newNoti.NoiDung,
            avatar: `https://i.pravatar.cc/40?u=msg${newNoti.MaPhienChat}`,
            time: newNoti.ThoiGianTao,
            is_read: false,
          });
        }

        if (data.type === "new_support_notification") {
          const newNoti = data.notification;
          this.notifications.unshift({
            id: newNoti.MaThongBao,
            type: 'support_request',
            phienChatId: newNoti.MaPhienChat,
            clientId: data.clientId,
            clientName: `Khách ${data.clientId}`,
            text: newNoti.NoiDung,
            avatar: `https://i.pravatar.cc/40?u=sup${data.clientId}`,
            time: newNoti.ThoiGianTao,
            is_read: false,
          });
        }

        if (data.type === "request_claimed") {
          this.notifications = this.notifications.filter(
            noti => noti.id !== data.notificationId
          );
          if (data.acceptedByEmployeeId !== this.employee.MaNV) {
            this.clients = this.clients.filter(c => c.id !== data.clientId);
          }
        }

        if (data.type === "client_message") {
          this.addOrUpdateClient(data.clientId);
        }
      };

      this.ws.onclose = () => {
        console.log("🔴 [Store] WebSocket disconnected.");
        // Optional: attempt to reconnect
      };

      this.ws.onerror = (error) => {
        console.error("❌ [Store] WebSocket error:", error);
      };
    },

    // =================================
    // CHAT & CLIENTS
    // =================================
    async acceptRequest(notification) {
      await this.addOrUpdateClient(notification.clientId);
      if (this.ws) {
        this.ws.send(JSON.stringify({
          type: "admin_accept_request",
          clientId: notification.clientId,
          employeeId: this.employee.MaNV,
          phienChatId: notification.phienChatId,
          notificationId: notification.id 
        }));
        this.notifications = this.notifications.filter(n => n.id !== notification.id);
        this.setActiveClient(notification.clientId);
        router.push({ name: 'Chat' });
      }
    },

    setActiveClient(clientId) {
      this.activeClientIdForChat = clientId;
    },

    async addOrUpdateClient(clientId) {
      let client = this.clients.find((c) => c.id === clientId);
      if (client) {
        if (client.name.startsWith(`Khách `)) {
          try {
            const response = await axios.get(`http://localhost:3000/api/auth/client/${clientId}`);
            if (response.data.HoTen) client.name = response.data.HoTen;
          } catch (error) { /* ignore */ }
        }
        return client;
      } else {
        let newClientData;
        try {
          const response = await axios.get(`http://localhost:3000/api/auth/client/${clientId}`);
          newClientData = { id: clientId, name: response.data.HoTen };
        } catch (error) {
          newClientData = { id: clientId, name: `Khách ${clientId}`};
        }
        this.clients.push(newClientData);
        return newClientData;
      }
    },
  }
});
