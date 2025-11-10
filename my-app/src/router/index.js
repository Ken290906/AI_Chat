import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '../views/AdminLayout.vue'
import ClientChat from '../components/ClientChat.vue'
import AccessLog from '../components/AccessLog.vue'

const routes = [
  {
    path: '/',
    name: 'Admin',
    component: AdminLayout,
    children: [
      {
        path: '',
        redirect: { name: 'Dashboard' }
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../components/Dashboard.vue')
      },
      {
        path: 'chat',
        name: 'Chat',
        component: () => import('../components/ChatPanel.vue')
      },
      {
        path: 'settings',
        name: 'Settings',
        component: AccessLog
      },
      {
        path: 'warning',
        name: 'Warning',
        component: () => import('../components/WarningTable.vue')
      }
    ]
  },
  {
    path: '/client',
    name: 'ClientChat',
    component: ClientChat
  },
  {
    path: '/login',
    name: 'EmployeeLogin',
    component: () => import('../views/EmployeeLogin.vue')
  }
]

const router = createRouter({
  history: createWebHistory(), // SỬA THÀNH createWebHistory (bỏ chữ Web thừa)
  routes
})

export default router