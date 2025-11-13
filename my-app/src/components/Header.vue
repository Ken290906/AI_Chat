<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-white border-bottom">
    <div class="container-fluid">
      <a class="navbar-brand" href="#">
        <img src="../assets/logo.jpg" alt="Tâm Trà Logo" style="height: 50px;">
      </a>
      <div class="collapse navbar-collapse" id="navbarSupportedContent">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0"></ul>
        <div class="d-flex align-items-center">
          <div class="employee-info me-3 text-end">
            <div class="fw-bold small">{{ employeeName }}</div>
            <div class="text-muted extra-small">Mã NV: {{ employeeId }}</div>
          </div>
          
          <div class="position-relative">
            <button class="btn btn-link text-secondary position-relative" @click="toggleNotifications">
              <i class="bi bi-bell fs-5"></i>
              <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount }}</span>
            </button>
            
            <div v-if="showNotifications" class="notifications-dropdown">
              <div class="notifications-header">
                <h6 class="mb-0 fw-bold">Thông báo</h6>
              </div>
              
              <div class="notifications-list">
                <div v-if="notifications.length === 0" class="text-center py-4 text-muted">
                  <i class="bi bi-bell-slash fs-1 mb-2"></i>
                  <p class="mb-0">Không có thông báo mới</p>
                </div>
                
                <div 
                  v-else
                  v-for="notification in notifications" 
                  :key="notification.id"
                  class="notification-item"
                  :class="{'is-unread': !notification.is_read}"
                  @click="handleItemClick(notification)"
                >
                  <!-- Icon -->
                  <div class="notification-icon">
                     <img v-if="notification.avatar" :src="notification.avatar" class="rounded-circle" alt="User" style="width: 40px; height: 40px;">
                     <i v-else class="bi bi-headset fs-4 text-primary"></i>
                  </div>
                  <!-- Content -->
                  <div class="notification-content">
                    <div class="notification-title">
                      <span v-if="notification.type === 'support_request'">
                        <strong>{{ notification.clientName }}</strong> đang cần hỗ trợ!
                      </span>
                      <span v-else>
                        <strong>{{ notification.name }}</strong>: {{ notification.text }}
                      </span>
                    </div>
                    <div class="notification-time">{{ formatTime(notification.time) }}</div>
                  </div>
                  <!-- Actions -->
                  <div class="notification-actions">
                    <button v-if="notification.type === 'support_request'" class="btn btn-sm btn-primary" @click.stop="$emit('accept-request', notification)">
                      Đồng ý
                    </button>
                    <span v-if="!notification.is_read" class="unread-dot"></span>
                  </div>
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
              <li><span class="dropdown-item-text small fw-bold">{{ employeeName }}</span></li>
              <li><span class="dropdown-item-text small text-muted">Mã NV: {{ employeeId }}</span></li>
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
  props: {
    notifications: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      employeeName: 'Admin',
      employeeId: '...',
      showNotifications: false,
    }
  },
  computed: {
    unreadCount() {
      return this.notifications.filter(n => !n.is_read).length;
    }
  },
  mounted() {
    this.loadEmployeeInfo();
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  },
  methods: {
    loadEmployeeInfo() {
      const savedEmployee = localStorage.getItem('employee');
      if (savedEmployee) {
        try {
          const employee = JSON.parse(savedEmployee);
          this.employeeName = employee.HoTen;
          this.employeeId = employee.MaNV;
        } catch (error) {
          console.error('Header - Error parsing employee data:', error);
        }
      }
    },

    toggleNotifications() {
      this.showNotifications = !this.showNotifications;
    },

    handleItemClick(notification) {
      this.$emit('mark-as-read', notification.id);
      if (notification.type === 'message') {
        // Optional: navigate to chat on message click
      }
    },

    formatTime(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      
      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      return date.toLocaleDateString('vi-VN');
    },

    logout() {
      localStorage.removeItem('employee');
      window.location.href = '/login';
    },

    handleClickOutside(event) {
      if (this.$el.contains(event.target)) return;
      this.showNotifications = false;
    }
  }
}
</script>

<style scoped>
.navbar {
  height: 70px;
}
.employee-info {
  border-right: 1px solid #dee2e6;
  padding-right: 1rem;
}
.extra-small {
  font-size: 0.75rem;
}
.notification-badge {
  position: absolute;
  top: 0px;
  right: -2px;
  background: #dc3545;
  color: white;
  font-size: 0.65rem;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 10px;
}
.notifications-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 400px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  z-index: 1070;
}
.notifications-header {
  padding: 1rem;
  border-bottom: 1px solid #e4e6eb;
}
.notifications-list {
  max-height: 450px;
  overflow-y: auto;
}
.notification-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  gap: 1rem;
  transition: background-color 0.2s;
}
.notification-item:not(:last-child) {
  border-bottom: 1px solid #f0f0f0;
}
.notification-item.is-unread {
  background-color: #eaf2ff;
}
.notification-item:hover {
  background-color: #f8f9fa;
  cursor: pointer;
}
.notification-content {
  flex-grow: 1;
}
.notification-title {
  font-size: 0.9rem;
  color: #333;
}
.notification-time {
  font-size: 0.75rem;
  color: #6c757d;
}
.notification-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.unread-dot {
  width: 10px;
  height: 10px;
  background: #0d6efd;
  border-radius: 50%;
}
.notifications-footer {
  padding: 0.5rem;
  border-top: 1px solid #e4e6eb;
  text-align: center;
}
.view-all-link {
  font-size: 0.9rem;
  text-decoration: none;
}
</style>