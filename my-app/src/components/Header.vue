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
          
          <button class="btn btn-link text-secondary" @click="toggleNotifications">
            <i class="bi bi-bell fs-5"></i>
          </button>
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
      employee: null
    }
  },
  mounted() {
    this.loadEmployeeInfo();
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

    toggleNotifications() {
      this.$emit('toggle-notifications');
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
</style>