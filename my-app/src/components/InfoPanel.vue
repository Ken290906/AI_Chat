<template>
  <div class="info-panel p-3">
    <div class="card mb-3">
        <div class="card-header bg-transparent d-flex justify-content-between align-items-center">
            <h6 class="mb-0 fw-bold">Đơn cần xử lý</h6>
            <i class="bi bi-chevron-up"></i>
        </div>
        <div class="card-body text-center">
            <i class="bi bi-archive-fill display-4 text-muted"></i>
            <p class="text-muted mt-2">Không có thông tin đơn hàng</p>
        </div>
    </div>
     <div class="card mb-3">
        <div class="card-header bg-transparent d-flex justify-content-between align-items-center">
            <h6 class="mb-0 fw-bold">Lịch sử mua hàng</h6>
            <i class="bi bi-chevron-up"></i>
        </div>
     </div>
     <div class="d-grid mt-3">
        <button class="btn btn-primary-custom">
            <i class="bi bi-plus-circle"></i> Lên đơn
        </button>
     </div>
  </div>
</template>

<script>
export default {
  name: 'InfoPanel'
}
</script>

<style scoped>
.info-panel {
  background-color: #F8F9FA;
  height: 100%;
  border-left: 1px solid #dee2e6;
}
.card {
  border: none;
  border-radius: 0.75rem;
  transition: box-shadow 0.3s ease;
}
.card:hover {
  box-shadow: 0 .5rem 1rem rgba(0,0,0,.05);
}
.card-header {
    border-bottom: 0;
}
.display-4 {
  font-size: 3rem;
  opacity: 0.5;
}
.btn-primary-custom {
    background-color: #4A55A2;
    color: white;
    border: none;
    border-radius: 0.5rem;
    padding: 0.75rem;
    font-weight: 500;
    transition: background-color 0.3s ease;
}
.btn-primary-custom:hover {
    background-color: #3a448a;
}
</style>