<template>
  <router-view />
</template>

<script>
import { RouterView } from 'vue-router'; // Import RouterView

export default {
  name: 'App',
  components: {
    RouterView // Register RouterView locally
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
  margin: 0;
  overflow: hidden; /* Prevent double scrollbars */
  background-color: var(--background-color);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--text-color);
  width: 100%;
  height: 100vh; /* Ensure app takes full viewport height */
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