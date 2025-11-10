<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-white border-bottom">
    <div class="container-fluid">
      <a class="navbar-brand" href="#">
        <img src="../assets/logo.jpg" alt="Tâm Trà Logo" style="height: 50px;">
      </a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarSupportedContent">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <!-- Có thể thêm các mục menu khác ở đây -->
        </ul>
        <div class="d-flex align-items-center">
          <!-- Hiển thị thông tin nhân viên -->
          <div class="employee-info me-3 text-end">
            <div class="fw-bold small">{{ employee ? employee.HoTen : 'Đang tải...' }}</div>
            <div class="text-muted extra-small">Mã NV: {{ employee ? employee.MaNV : '...' }}</div>
          </div>
          
          <div class="position-relative">
            <button class="btn btn-link text-secondary position-relative" @click="toggleNotifications">
              <i class="bi bi-bell fs-5"></i>
              <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount }}</span>
            </button>
            
            <!-- Dropdown thông báo -->
            <div v-if="showNotifications" class="notifications-dropdown">
              <div class="notifications-header">
                <h6 class="mb-0 fw-bold">Thông báo</h6>
                <button class="btn-close-notifications" @click="toggleNotifications">
                  <i class="bi bi-x"></i>
                </button>
              </div>
              
              <div class="notifications-tabs">
                <button 
                  :class="['tab-btn', { active: activeTab === 'all' }]"
                  @click="activeTab = 'all'"
                >
                  Tất cả
                </button>
                <button 
                  :class="['tab-btn', { active: activeTab === 'unread' }]"
                  @click="activeTab = 'unread'"
                >
                  Chưa đọc
                </button>
              </div>
              
              <div class="notifications-list">
                <div v-if="loading" class="text-center py-4">
                  <div class="spinner-border spinner-border-sm" role="status">
                    <span class="visually-hidden">Đang tải...</span>
                  </div>
                </div>
                
                <div v-else-if="filteredNotifications.length === 0" class="text-center py-4 text-muted">
                  <i class="bi bi-bell-slash fs-1 mb-2"></i>
                  <p class="mb-0">Không có thông báo</p>
                </div>
                
                <div 
                  v-else
                  v-for="notification in filteredNotifications" 
                  :key="notification.MaCB"
                  class="notification-item"
                  @click="markAsRead(notification.MaCB)"
                >
                  <div class="notification-icon">
                    <i :class="getNotificationIcon(notification.PhanLoaiCanhBao?.MucDoUuTien)"></i>
                  </div>
                  <div class="notification-content">
                    <div class="notification-title">{{ notification.TenCB }}</div>
                    <div class="notification-time">{{ formatTime(notification.ThoiGianTao) }}</div>
                  </div>
                  <span v-if="!notification.read" class="unread-dot"></span>
                </div>
              </div>
              
              <div class="notifications-footer">
                <a href="#" class="view-all-link">Xem tất cả</a>
              </div>
            </div>
          </div>
          <div class="dropdown ms-2">
            <button class="btn btn-link text-secondary p-0" type="button" data-bs-toggle="dropdown">
              <img src="https://i.pravatar.cc/32" class="rounded-circle" alt="User">
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
              <li><span class="dropdown-item-text small fw-bold">{{ employee ? employee.HoTen : '' }}</span></li>
              <li><span class="dropdown-item-text small text-muted">Mã NV: {{ employee ? employee.MaNV : '' }}</span></li>
              <li><hr class="dropdown-divider"></li>
              <li><button class="dropdown-item text-danger" @click="logout"><i class="bi bi-box-arrow-right"></i> Đăng xuất</button></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'Header',
  data() {
    return {
      employee: null,
      showNotifications: false,
      notifications: [],
      loading: false,
      activeTab: 'all',
      readNotifications: new Set()
    }
  },
  computed: {
    unreadCount() {
      return this.notifications.filter(n => !this.readNotifications.has(n.MaCB)).length;
    },
    filteredNotifications() {
      if (this.activeTab === 'all') {
        return this.notifications.map(n => ({
          ...n,
          read: this.readNotifications.has(n.MaCB)
        }));
      }
      return this.notifications
        .filter(n => !this.readNotifications.has(n.MaCB))
        .map(n => ({ ...n, read: false }));
    }
  },
  mounted() {
    this.loadEmployeeInfo();
    this.loadNotifications();
    // Tự động tải lại thông báo mỗi 30 giây
    this.notificationInterval = setInterval(() => {
      this.loadNotifications();
    }, 30000);
  },
  beforeUnmount() {
    if (this.notificationInterval) {
      clearInterval(this.notificationInterval);
    }
  },
  methods: {
    loadEmployeeInfo() {
      // Lấy thông tin nhân viên từ localStorage
      const savedEmployee = localStorage.getItem('employee');
      if (savedEmployee) {
        try {
          this.employee = JSON.parse(savedEmployee);
          console.log("✅ Header - Employee info loaded:", this.employee);
        } catch (error) {
          console.error('❌ Header - Error parsing employee data:', error);
        }
      } else {
        console.warn('⚠️ Header - No employee data found in localStorage');
      }
    },

    async loadNotifications() {
      try {
        this.loading = true;
        const response = await fetch('http://localhost:3000/api/dashboard/recent-warnings');
        if (response.ok) {
          this.notifications = await response.json();
        }
      } catch (error) {
        console.error('Lỗi khi tải thông báo:', error);
      } finally {
        this.loading = false;
      }
    },

    toggleNotifications() {
      this.showNotifications = !this.showNotifications;
      if (this.showNotifications && this.notifications.length === 0) {
        this.loadNotifications();
      }
    },

    markAsRead(notificationId) {
      this.readNotifications.add(notificationId);
    },

    getNotificationIcon(priority) {
      switch(priority) {
        case 1: return 'bi bi-exclamation-circle-fill text-danger';
        case 2: return 'bi bi-exclamation-triangle-fill text-warning';
        default: return 'bi bi-info-circle-fill text-info';
      }
    },

    formatTime(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      const diffWeeks = Math.floor(diffMs / 604800000);

      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút`;
      if (diffHours < 24) return `${diffHours} giờ`;
      if (diffDays < 7) return `${diffDays} ngày`;
      if (diffWeeks < 4) return `${diffWeeks} tuần`;
      return date.toLocaleDateString('vi-VN');
    },

    logout() {
      // Xóa thông tin đăng nhập
      localStorage.removeItem('employee');
      // Chuyển hướng về trang login
      window.location.href = '/login';
    }
  }
}
</script>

<style scoped>
@keyframes pulse-glow {
  0% {
    box-shadow: 0 0 0 0 rgba(74, 85, 162, 0.7);
  }
  70% {
    box-shadow: 0 0 10px 15px rgba(74, 85, 162, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(74, 85, 162, 0);
  }
}

.navbar {
  transition: background-color 0.3s ease;
}
.navbar-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.brand-icon {
  font-size: 1.7rem;
  color: #4A55A2;
  transition: transform 0.3s ease;
  border-radius: 50%;
  padding: 5px;
  animation: pulse-glow 4s infinite cubic-bezier(0.66, 0, 0, 1);
}
.navbar-brand:hover .brand-icon {
  transform: rotate(360deg);
  animation-play-state: paused;
}
.btn-link {
  text-decoration: none;
}
.btn-link:hover {
  color: #4A55A2 !important;
}

.employee-info {
  border-right: 1px solid #dee2e6;
  padding-right: 1rem;
}

.extra-small {
  font-size: 0.75rem;
}

/* Đảm bảo dropdown menu có z-index cao */
.dropdown-menu {
  z-index: 1060;
}

/* Notification Badge */
.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #e41e3f;
  color: white;
  font-size: 0.65rem;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

/* Notifications Dropdown */
.notifications-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 360px;
  max-height: 600px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 1070;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Header */
.notifications-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 16px 12px;
  border-bottom: 1px solid #e4e6eb;
}

.notifications-header h6 {
  font-size: 1.5rem;
  color: #050505;
}

.btn-close-notifications {
  background: #f0f2f5;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-close-notifications:hover {
  background: #e4e6eb;
}

.btn-close-notifications i {
  font-size: 1.25rem;
  color: #65676b;
}

/* Tabs */
.notifications-tabs {
  display: flex;
  padding: 0 16px;
  border-bottom: 1px solid #e4e6eb;
}

.tab-btn {
  flex: 1;
  background: none;
  border: none;
  padding: 12px 16px;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #65676b;
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
}

.tab-btn:hover {
  background: #f0f2f5;
  border-radius: 8px 8px 0 0;
}

.tab-btn.active {
  color: #1877f2;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #1877f2;
}

/* Notifications List */
.notifications-list {
  flex: 1;
  overflow-y: auto;
  max-height: 400px;
}

.notifications-list::-webkit-scrollbar {
  width: 8px;
}

.notifications-list::-webkit-scrollbar-track {
  background: #f0f2f5;
}

.notifications-list::-webkit-scrollbar-thumb {
  background: #bcc0c4;
  border-radius: 4px;
}

.notifications-list::-webkit-scrollbar-thumb:hover {
  background: #8a8d91;
}

/* Notification Item */
.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
  gap: 12px;
}

.notification-item:hover {
  background: #f0f2f5;
}

.notification-item:not(:last-child) {
  border-bottom: 1px solid #e4e6eb;
}

.notification-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notification-icon i {
  font-size: 1.5rem;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 0.9375rem;
  color: #050505;
  line-height: 1.3333;
  margin-bottom: 4px;
  word-wrap: break-word;
}

.notification-time {
  font-size: 0.8125rem;
  color: #65676b;
  line-height: 1.2308;
}

.unread-dot {
  width: 12px;
  height: 12px;
  background: #1877f2;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 8px;
}

/* Footer */
.notifications-footer {
  padding: 8px;
  border-top: 1px solid #e4e6eb;
  text-align: center;
}

.view-all-link {
  display: block;
  padding: 8px;
  color: #1877f2;
  font-size: 0.9375rem;
  font-weight: 600;
  text-decoration: none;
  border-radius: 6px;
  transition: background 0.2s;
}

.view-all-link:hover {
  background: #f0f2f5;
  color: #1877f2;
}
</style>