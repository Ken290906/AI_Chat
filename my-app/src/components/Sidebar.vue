<template>
  <div :class="['sidebar', 'd-flex', 'flex-column', 'p-3', {'collapsed': !isOpen}]">
    <div class="dropdown mb-3">
      <a href="#" class="d-flex align-items-center text-dark text-decoration-none dropdown-toggle" id="dropdownUser2" data-bs-toggle="dropdown" aria-expanded="false">
        <img src="https://i.pravatar.cc/32" alt="" width="32" height="32" class="rounded-circle me-2">
        <transition name="fade-slide">
          <strong v-show="isOpen">My Workspace</strong>
        </transition>
      </a>
      <ul class="dropdown-menu text-small shadow" aria-labelledby="dropdownUser2">
        <li><a class="dropdown-item" href="#">New...</a></li>
        <li><a class="dropdown-item" href="#">Settings</a></li>
        <li><a class="dropdown-item" href="#">Profile</a></li>
        <li><hr class="dropdown-divider"></li>
        <li><a class="dropdown-item" href="#">Sign out</a></li>
      </ul>
    </div>

    <transition name="fade-slide">
      <span v-show="isOpen" class="text-muted small text-uppercase">Menu</span>
    </transition>
    <hr>
    <ul class="nav nav-pills flex-column mb-auto">
      <li class="nav-item">
        <a href="#" 
          :class="['nav-link', {'justify-content-center': !isOpen, 'active': activeTab === 'dashboard'}]" 
          @click.prevent="setActiveTab('dashboard')">
          <i class="bi bi-view-stacked me-2"></i>
          <transition name="fade-slide">
            <span v-show="isOpen">Tổng quan</span>
          </transition>
        </a>
      </li>
      <li>
        <a href="#" 
          :class="['nav-link', {'justify-content-center': !isOpen, 'active': activeTab === 'chat'}]"
          @click.prevent="setActiveTab('chat')">
          <i class="bi bi-chat-quote me-2"></i>
          <transition name="fade-slide">
            <span v-show="isOpen">Hội thoại</span>
          </transition>
          <transition name="fade-slide">
            <span v-show="isOpen" class="badge bg-danger rounded-pill ms-auto">1</span>
          </transition>
        </a>
      </li>
      <li>
        <a href="#" 
          :class="['nav-link', {'justify-content-center': !isOpen, 'active': activeTab === 'settings'}]"
          @click.prevent="setActiveTab('settings')">
          <i class="bi bi-gear me-2"></i>
          <transition name="fade-slide">
            <span v-show="isOpen">Thiết lập</span>
          </transition>
        </a>
      </li>
      <li>
        <a href="#" 
          :class="['nav-link', {'justify-content-center': !isOpen, 'active': activeTab === 'warning'}]"
          @click.prevent="setActiveTab('warning')">
          <i class="bi bi-exclamation-triangle me-2"></i>
          <transition name="fade-slide">
            <span v-show="isOpen">Cảnh báo</span>
          </transition>
        </a>
      </li>
    </ul>
    <hr>
    <div class="nav-item">
       <a href="#" :class="['nav-link', {'justify-content-center': !isOpen}]" @click="handleToggleSidebar">
        <i :class="['me-2', {'bi-arrows-angle-contract': isOpen, 'bi-arrows-angle-expand': !isOpen}]"></i>
        <transition name="fade-slide">
          <span v-show="isOpen">Thu gọn</span>
        </transition>
       </a>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Sidebar',
  props: {
    isOpen: {
      type: Boolean,
      default: true
    },
    activeTab: {
      type: String,
      default: 'chat' // Mặc định là chat
    }
  },
  methods: {
    handleToggleSidebar(event) {
      event.preventDefault();
      console.log('Sidebar: Toggling sidebar');
      this.$emit('toggle-sidebar');
    },
    setActiveTab(tab) {
      console.log('Sidebar: Setting active tab to', tab);
      this.$emit('selectTab', tab);
    }
  }
}
</script>

<style scoped>
@keyframes active-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(197, 223, 248, 0.7); /* Accent color with opacity */
  }
  70% {
    box-shadow: 0 0 0 5px rgba(197, 223, 248, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(197, 223, 248, 0);
  }
}

@keyframes badge-pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.sidebar {
  background-color: var(--sidebar-bg);
  height: 100%;
  border-right: 1px solid var(--border-color);
  overflow-x: hidden; /* Hide content when collapsed */
  transition: width 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94); /* Moved transition here */
  flex-shrink: 0; /* Prevent shrinking */
  width: 200px; /* Expanded width */
}

.sidebar.collapsed {
  width: 60px; /* Collapsed width */
}

.sidebar .nav-link {
  color: var(--text-color);
  display: flex;
  align-items: center;
  margin: 0.25rem 0;
  padding: 0.75rem;
  border-radius: 0.5rem;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.sidebar .nav-link i {
  font-size: 1.2rem;
  opacity: 0.7;
}

.sidebar .nav-link.justify-content-center i {
  margin-right: 0 !important; /* Center icons when collapsed */
}

.sidebar .nav-link.active {
  background-color: var(--primary-color);
  color: white;
  font-weight: 500;
  animation: active-pulse 2s infinite ease-out; /* Apply animation */
}

.sidebar .nav-link.active i {
  opacity: 1;
}

.sidebar .nav-link:not(.active):hover {
  background-color: var(--background-color);
}

.sidebar .nav-link .badge {
  animation: badge-pulse 1.5s infinite ease-in-out;
}

hr {
  opacity: 0.1;
}

/* Fade and slide transition for text content */
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: opacity 1.0s ease, transform 1.0s ease; /* Increased duration to 1.0s */
}
.fade-slide-enter-from, .fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>