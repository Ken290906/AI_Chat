[file name]: AdminLayout.vue
[file content begin]
<template>
  <div id="app-layout" :class="{'sidebar-collapsed': !isSidebarOpen}">
    <Header @toggle-notifications="toggleToast" />
    <!-- <ToastNotification :show="showToast" @close="showToast = false" /> -->
    <!-- ✅ Gán ref để gọi hàm show() trực tiếp -->
    <ToastNotification ref="toastRef" :show="showToast" @close="showToast = false" />

    <div class="main-content container-fluid">
      <div class="row flex-nowrap">
        <div class="col-auto p-0 sidebar-wrapper">
          <Sidebar 
            :isOpen="isSidebarOpen" 
            :activeTab="activeTab"
            @toggle-sidebar="toggleSidebar"
            @selectTab="handleTabSelect" />
        </div>
        
        <!-- Dashboard View - Chiếm toàn bộ không gian còn lại -->
        <div v-if="activeTab === 'dashboard'" class="col p-0">
          <Dashboard />
        </div>
        
        <!-- Chat View - Với InfoPanel bên cạnh -->
        <div v-else class="col p-0">
          <div class="row h-100">
            <div class="col-md-9 p-0">
              <!-- <ChatPanel /> -->
               <!-- ✅ Lắng nghe sự kiện support-request từ ChatPanel -->
              <ChatPanel @support-request="handleSupportRequest" />
            </div>
            <div class="col-md-3 d-none d-md-block p-0">
              <InfoPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Header from '../components/Header.vue'
import Sidebar from '../components/Sidebar.vue'
import ChatPanel from '../components/ChatPanel.vue'
import InfoPanel from '../components/InfoPanel.vue'
import ToastNotification from '../components/ToastNotification.vue'
import Dashboard from '../components/Dashboard.vue'

export default {
  name: 'AdminLayout',
  components: {
    Header,
    Sidebar,
    ChatPanel,
    InfoPanel,
    ToastNotification,
    Dashboard
  },
  data() {
    return {
      showToast: false,
      isSidebarOpen: true,
      activeTab: 'chat' // Mặc định hiển thị chat
    }
  },
  methods: {
    toggleToast() {
      this.showToast = !this.showToast;
      if (this.showToast) {
        setTimeout(() => {
          this.showToast = false;
        }, 5000);
      }
    },
    toggleSidebar() {
      this.isSidebarOpen = !this.isSidebarOpen;
    },
    handleTabSelect(tab) {
      this.activeTab = tab;
    },

    // ✅ HÀM MỚI: xử lý sự kiện support-request từ ChatPanel
    handleSupportRequest(clientId) {
      if (this.$refs.toastRef && this.$refs.toastRef.show) {
        this.$refs.toastRef.show(`📢 Khách hàng ${clientId} cần hỗ trợ gấp!`);
      } else {
        console.warn('ToastNotification chưa sẵn sàng!');
      }
    }
  }
}
</script>

<style>
/* Global styles for ZenChat */
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

#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--text-color);
}

.main-content, .main-content .row {
  height: calc(100vh - 61px);
}

.sidebar-wrapper {
  transition: width 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  width: 200px;
  flex-shrink: 0;
}

#app-layout.sidebar-collapsed .sidebar-wrapper {
  width: 60px;
}

.main-content .row > div {
  height: 100%;
  overflow-y: auto;
}

/* Đảm bảo các phần tử con chiếm toàn bộ chiều cao */
.main-content .row.h-100 {
  margin: 0;
}

.main-content .row.h-100 > div {
  height: 100%;
}

/* Custom scrollbar */
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
[file content end]