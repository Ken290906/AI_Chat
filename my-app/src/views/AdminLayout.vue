<template>
  <div id="app-layout" :class="{'sidebar-collapsed': !isSidebarOpen}">
    <Header @toggle-notifications="toggleToast" />
    <ToastNotification :show="showToast" @close="showToast = false" />

    <div class="main-content container-fluid">
      <div class="row flex-nowrap"> <!-- Added flex-nowrap to prevent wrapping -->
        <div class="col-auto p-0 sidebar-wrapper"> <!-- col-auto for sidebar -->
          <Sidebar :isOpen="isSidebarOpen" @toggle-sidebar="toggleSidebar" />
        </div>
        <div class="col p-0"> <!-- col to take remaining space -->
          <ChatPanel />
        </div>
        <div class="col-lg-3 d-none d-lg-block p-0">
          <InfoPanel />
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

export default {
  name: 'AdminLayout',
  components: {
    Header,
    Sidebar,
    ChatPanel,
    InfoPanel,
    ToastNotification
  },
  data() {
    return {
      showToast: false,
      isSidebarOpen: true // New state for sidebar
    }
  },
  methods: {
    toggleToast() {
      this.showToast = !this.showToast;
      if (this.showToast) {
        setTimeout(() => {
          this.showToast = false;
        }, 5000); // Auto-hide after 5 seconds
      }
    },
    toggleSidebar() { // New method to toggle sidebar
      this.isSidebarOpen = !this.isSidebarOpen;
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
  height: calc(100vh - 61px); /* Adjusted for new header height */
}

.sidebar-wrapper {
  transition: width 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94); /* Increased duration to 1.2s */
  width: 200px; /* Default expanded width */
  flex-shrink: 0; /* Prevent shrinking */
}

#app-layout.sidebar-collapsed .sidebar-wrapper {
  width: 60px; /* Collapsed width */
}

.main-content .row > div {
  height: 100%;
  overflow-y: auto;
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
