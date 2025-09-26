<template>
  <transition name="toast">
    <div v-if="show" class="toast-container position-fixed top-0 end-0 p-3">
      <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-header">
          <i class="bi bi-flag-fill me-2 brand-icon"></i>
          <strong class="me-auto">Thông báo</strong>
          <small>vài giây trước</small>
          <button type="button" class="btn-close" @click="close" aria-label="Close"></button>
        </div>
        <div class="toast-body">
          Khách hàng "Chưa xác định" tại cửa hàng Alosop cần hỗ trợ trực tiếp.
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'ToastNotification',
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    close() {
      this.$emit('close');
    }
  }
}
</script>

<style scoped>
.toast-container {
  z-index: 1055; /* Ensure it's above other content */
}
.brand-icon {
  color: #4A55A2; /* New primary color */
}

/* Toast Animation */
.toast-enter-active {
  animation: slide-in 0.5s ease-out;
}
.toast-leave-active {
  animation: slide-out 0.5s ease-in;
}

@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slide-out {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}
</style>
