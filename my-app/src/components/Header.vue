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
          <!-- Simplified or can be used for other nav items later -->
        </ul>
        <div class="d-flex align-items-center">
          <button class="btn btn-link text-secondary" @click="toggleNotifications">
            <i class="bi bi-bell fs-5"></i>
          </button>
          <div class="ms-2">
            <img src="https://i.pravatar.cc/32" class="rounded-circle" alt="User">
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'Header',
  methods: {
    toggleNotifications() {
      this.$emit('toggle-notifications');
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
  color: #4A55A2; /* New primary color */
  transition: transform 0.3s ease;
  border-radius: 50%; /* Important for circular glow */
  padding: 5px; /* Add some padding so the glow isn't cut off */
  animation: pulse-glow 4s infinite cubic-bezier(0.66, 0, 0, 1);
}
.navbar-brand:hover .brand-icon {
  transform: rotate(360deg);
  animation-play-state: paused; /* Pause the glow on hover to play the spin */
}
.btn-link {
  text-decoration: none;
}
.btn-link:hover {
  color: #4A55A2 !important;
}
</style>
