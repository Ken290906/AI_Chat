import { defineConfig, searchForWorkspaceRoot } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    fs: {
      allow: [
        // Add the project root
        searchForWorkspaceRoot(process.cwd()),
        // Add the bootstrap-icons directory
        '/Users/nguyenhuan/node_modules/bootstrap-icons/'
      ]
    }
  }
})
