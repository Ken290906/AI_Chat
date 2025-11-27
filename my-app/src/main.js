import { createApp } from 'vue'
import { createPinia } from 'pinia' // Import Pinia
import './style.css'
import App from './App.vue'
import router from './router/index.js'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

const app = createApp(App)
const pinia = createPinia() // Create Pinia instance

app.use(router)
app.use(pinia) // Use Pinia

app.mount('#app')
