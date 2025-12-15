<template>
  <div id="app-layout" :class="{'sidebar-collapsed': !isSidebarOpen}">
    <Header />
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
                @select-client="handleSelectClient" 
                @support-request="handleSupportRequest" 
              />
            </keep-alive>
          </router-view>
          </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useMainStore } from '../stores/mainStore';
import { useRouter } from 'vue-router';

import Header from '../components/Header.vue';
import Sidebar from '../components/Sidebar.vue';
import ToastNotification from '../components/ToastNotification.vue';

const mainStore = useMainStore();
const router = useRouter();

// Reactive state from the store
const { 
  employee, 
  clients, 
  activeClientIdForChat,
  ws // Direct access for passing as prop
} = storeToRefs(mainStore);

// Actions from the store
const { 
  initializeStore, 
  setActiveClient 
} = mainStore;

// Local state for UI that doesn't belong in the store
const isSidebarOpen = ref(true);
const activeTab = ref('chat');
const toastRef = ref(null); // Ref for the toast component

// Lifecycle hook
onMounted(() => {
  initializeStore();
});

// Methods that call store actions or manage local UI state
function handleSelectClient(client) {
  setActiveClient(client.id);
}

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value;
}

function handleTabSelect(tab) {
  activeTab.value = tab;
  if (router.currentRoute.value.name?.toLowerCase() !== tab) {
      router.push({ name: tab.charAt(0).toUpperCase() + tab.slice(1) });
  }
}

// This function is for the Toast, which is a UI concern and can stay here.
// It can be triggered by watching store state changes if needed.
function handleSupportRequest(clientId) {
  if (toastRef.value) {
    toastRef.value.show(`📢 Khách hàng ${clientId} cần hỗ trợ!`, 'warning', 'Cảnh báo mới');
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
