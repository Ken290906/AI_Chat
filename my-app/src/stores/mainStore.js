import { defineStore } from 'pinia';
import axios from 'axios';
import router from '../router';

export const useMainStore = defineStore('main', {
  state: () => ({
    ws: null,
    employee: null,
    clients: [],
    notifications: [],
    warnings: [], // Thêm state cho warnings
    activeClientIdForChat: null,
  }),

  getters: {
    unreadNotificationsCount: (state) => {
      // Đếm tổng số thông báo và cảnh báo chưa đọc
      const unreadNotifications = state.notifications.filter(n => !n.is_read).length;
      const unreadWarnings = state.warnings.filter(w => !w.is_read).length;
      return unreadNotifications + unreadWarnings;
    },
    // Getter đã được đơn giản hóa và tăng cường tính an toàn cho hàm sort
    sortedCombinedNotifications(state) {
      // Cả hai mảng giờ đều chứa các đối tượng đã được ánh xạ
      const combined = [
        ...state.notifications,
        ...state.warnings
      ];
      // Sắp xếp tất cả theo thời gian, mới nhất lên đầu
      return combined.sort((a, b) => {
        const dateA = new Date(a.time);
        const dateB = new Date(b.time);

        // Xử lý trường hợp ngày không hợp lệ
        if (isNaN(dateA.getTime())) return 1;
        if (isNaN(dateB.getTime())) return -1;

        return dateB - dateA;
      });
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
        this.fetchWarnings(); // Gọi fetch warnings
      } catch (error) {
        console.error('Error initializing store:', error);
        router.push('/login');
      }
    },

    // =================================
    // NOTIFICATIONS & WARNINGS
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

    // Sửa lại fetchWarnings để map dữ liệu ngay lập tức
    async fetchWarnings() {
      try {
        const response = await axios.get("http://localhost:3000/api/dashboard/warnings");
        this.warnings = response.data.map(w => ({
          id: w.MaCanhBao,
          type: 'warning',
          text: w.NoiDung,
          time: w.ThoiGianTao,
          is_read: w.TrangThai === 'DaDoc',
          phienChatId: w.MaPhienChat,
          clientId: w.PhienChat?.MaKH,
          clientName: w.PhienChat?.KhachHang?.HoTen || `Khách ${w.PhienChat?.MaKH}`,
          phanLoai: w.PhanLoaiCanhBao?.PhanLoai, // Thêm phân loại
          ghiChu: w.GhiChu, // Thêm ghi chú
        }));
        console.log("✅ [Store] Fetched initial warnings");
      } catch (error) {
        console.error("❌ [Store] Error fetching initial warnings:", error);
      }
    },

    async markAsRead(notificationId, type) {
      if (type === 'warning') {
        const warning = this.warnings.find(w => w.id === notificationId);
        if (warning && !warning.is_read) {
          try {
            await axios.put(`http://localhost:3000/api/canhbao/${notificationId}/read`);
            warning.is_read = true;
          } catch (error) {
            console.error(`❌ [Store] Error marking warning ${notificationId} as read:`, error);
          }
        }
      } else {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification && !notification.is_read) {
          try {
            await axios.put(`http://localhost:3000/api/thongbao/${notificationId}/read`);
            notification.is_read = true;
          } catch (error) {
            console.error(`❌ [Store] Error marking notification ${notificationId} as read:`, error);
          }
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

        if (data.type === "new_warning") {
          // Dữ liệu warning từ websocket cũng cần được map
          const newWarning = data.warning;
          this.warnings.unshift({
            id: newWarning.MaCanhBao,
            type: 'warning',
            text: newWarning.NoiDung,
            time: newWarning.ThoiGianTao,
            is_read: false,
            phienChatId: newWarning.MaPhienChat,
            clientId: newWarning.PhienChat?.MaKH,
            clientName: newWarning.PhienChat?.KhachHang?.HoTen || `Khách ${newWarning.PhienChat?.MaKH}`,
            phanLoai: newWarning.PhanLoaiCanhBao?.PhanLoai, // Thêm phân loại
            ghiChu: newWarning.GhiChu, // Thêm ghi chú
          });
        }

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

        if (data.type === "support_request") { 
            const newNoti = data; 
            
            this.notifications.unshift({
                id: newNoti.canhBaoId, 
                type: 'support_request',
                phienChatId: newNoti.chatSessionId,
                clientId: newNoti.clientId,
                clientName: `Khách ${newNoti.clientId}`,
                text: newNoti.message, 
                avatar: `https://i.pravatar.cc/40?u=sup${newNoti.clientId}`,
                time: new Date(),
                is_read: false,
                canhBaoId: newNoti.canhBaoId
            });
            window.dispatchEvent(new CustomEvent('supportRequest', { detail: newNoti.clientId }));
            this.addOrUpdateClient(newNoti.clientId);
        }

        if (data.type === "agent_accepted") {
            const clientIndex = this.clients.findIndex(c => c.id === data.clientId);
            if (clientIndex !== -1) {
                this.clients[clientIndex].sessionId = data.chatSessionId;
                console.log(`✅ [Store] Client ${data.clientId} updated with new Session ID: ${data.chatSessionId}`);
            }
            this.setActiveClient(data.clientId);
        }

        if (data.type === "client_message") {
          this.addOrUpdateClient(data.clientId);
        }
      };

      this.ws.onclose = () => {
        console.log("🔴 [Store] WebSocket disconnected.");
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
          canhBaoId: notification.id, 
          phienChatId: notification.phienChatId,
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
        return client;
      } else {
        let newClientData;
        try {
          const response = await axios.get(`http://localhost:3000/api/auth/client/${clientId}`);
          newClientData = { id: clientId, name: response.data.HoTen, sessionId: null }; 
        } catch (error) {
          newClientData = { id: clientId, name: `Khách ${clientId}`, sessionId: null };
        }
        this.clients.push(newClientData);
        return newClientData;
      }
    },
  }
});
