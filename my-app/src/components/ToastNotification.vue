<template>
  <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 1100;">
    <div
      v-for="(toast, index) in toasts"
      :key="index"
      :class="['toast align-items-center text-white border-0 show', toast.type]"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div class="d-flex">
        <div class="toast-body">
          <strong>{{ toast.title }}</strong><br />
          {{ toast.message }}
        </div>
        <button
          type="button"
          class="btn-close btn-close-white me-2 m-auto"
          @click="removeToast(index)"
        ></button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ToastNotification",
  data() {
    return {
      toasts: []
    };
  },
  methods: {
    // ✅ Hàm show() để AdminLayout gọi qua this.$refs.toastRef.show()
    show(message, type = "info", title = "Thông báo", duration = 5000) {
      const toast = { title, message, type };
      this.toasts.push(toast);
      setTimeout(() => {
        this.toasts.shift();
      }, duration);
    },
    removeToast(index) {
      this.toasts.splice(index, 1);
    }
  }
};
</script>

<style scoped>
.toast {
  min-width: 280px;
  margin-bottom: 12px;
  border-radius: 0.75rem;
  animation: fadeIn 0.4s ease;
}
.toast.warning {
  background-color: #ffc107;
  color: #000;
}
.toast.success {
  background-color: #198754;
}
.toast.info {
  background-color: #0dcaf0;
}
.toast.error {
  background-color: #dc3545;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}
</style>
