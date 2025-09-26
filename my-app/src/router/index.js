import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '../views/AdminLayout.vue'
import ClientChat from '../components/ClientChat.vue'

const routes = [
  {
    path: '/',
    name: 'Admin',
    component: AdminLayout
  },
  {
    path: '/client',
    name: 'Client',
    component: ClientChat
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
