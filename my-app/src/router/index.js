import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '../views/AdminLayout.vue'
import ClientChat from '../components/ClientChat.vue'
import AccessLog from '../components/AccessLog.vue' // Keep this import
// import SettingsLayout from '../views/SettingsLayout.vue' // Removed import

const routes = [
  {
    path: '/',
    name: 'Admin',
    component: AdminLayout,
    children: [ // Nested routes for AdminLayout
      {
        path: '', // Default child route for AdminLayout (e.g., /)
        redirect: { name: 'Dashboard' }
      },
      {
        path: 'dashboard', // /dashboard
        name: 'Dashboard',
        component: () => import('../components/Dashboard.vue') // Lazy load Dashboard
      },
      {
        path: 'chat', // /chat
        name: 'Chat',
        component: () => import('../components/ChatPanel.vue') // Lazy load ChatPanel
      },
      {
        path: 'settings', // /settings
        name: 'Settings',
        component: AccessLog // Directly render AccessLog
      }
    ]
  },
  {
    path: '/client',
    name: 'ClientChat', // Renamed to avoid conflict with 'Client' in AdminLayout
    component: ClientChat
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router