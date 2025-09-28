<template>
  <div class="chat-panel container-fluid">
    <div class="row h-100">
      <!-- Conversation List -->
      <div class="col-md-4 border-end p-0 d-flex flex-column">
        <div class="p-3 border-bottom">
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="mb-0 fw-bold">Hội thoại</h5>
            <button class="btn btn-sm btn-outline-secondary border-0">
              <i class="bi bi-filter"></i> Bộ lọc
            </button>
          </div>
          <div class="input-group mt-3">
            <span class="input-group-text bg-light border-0"><i class="bi bi-search"></i></span>
            <input type="text" class="form-control bg-light border-0" id="chatSearchInput" placeholder="Tìm kiếm...">
          </div>
        </div>
        <div class="list-group list-group-flush overflow-auto flex-grow-1">
          <a href="#" class="list-group-item list-group-item-action active" aria-current="true">
            <div class="d-flex w-100 justify-content-between">
              <h6 class="mb-1">Chưa xác thực</h6>
              <small class="text-muted">7 tiếng</small>
            </div>
            <p class="mb-1 small text-muted">Dạ em đã nhận được thông tin rồi ạ. Nhân viên...</p>
            <div>
              <span class="badge rounded-pill bg-warning-subtle text-warning-emphasis">Yêu cầu hỗ trợ</span>
              <span class="badge rounded-pill bg-success-subtle text-success-emphasis">Khách mới</span>
            </div>
          </a>
          <!-- Other conversations -->
        </div>
      </div>

      <!-- Chat Window -->
      <div class="col-md-8 d-flex flex-column p-0">
        <div class="chat-header p-3 border-bottom d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-0 fw-bold">Chưa xác thực</h6>
            <small class="text-muted">Online via Website</small>
          </div>
        </div>

        <div class="chat-body flex-grow-1 p-4">
            <div class="alert alert-info small d-flex align-items-center" role="alert">
                <i class="bi bi-info-circle-fill me-2"></i>
                Nhân viên AI đã được tạm dừng khi bạn có mặt.
            </div>
          <!-- Messages -->
          <div class="d-flex justify-content-end mb-3 message-animation">
            <div class="message-bubble user-message">
              tôi cần hỗ trợ gấp
            </div>
          </div>
          <div class="d-flex justify-content-start mb-3 message-animation">
             <img src="https://i.pravatar.cc/32?u=agent" alt="" width="32" height="32" class="rounded-circle me-2">
            <div class="message-bubble agent-message">
              Dạ em đã nhận được thông tin rồi ạ. Nhân viên bên em sẽ liên hệ lại ngay để hỗ trợ mình kịp thời ạ.
              <div class="text-end text-white-50 small mt-1">10:52 14/09/2025</div>
            </div>
          </div>
        </div>

        <div class="chat-footer p-3">
          <div class="input-group">
            <button class="btn btn-outline-secondary border-0" type="button"><i class="bi bi-paperclip fs-5"></i></button>
            <input type="text" class="form-control border-0" id="chatMessageInput" placeholder="Nhập tin nhắn của bạn...">
            <button class="btn btn-primary-custom" type="button"><i class="bi bi-send-fill"></i></button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ChatPanel'
}
</script>

<style scoped>
@keyframes message-fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chat-panel, .row {
  height: 100%;
  background-color: var(--sidebar-bg);
}
.list-group-item {
  transition: background-color 0.2s ease;
}
.list-group-item.active {
    background-color: var(--accent-color);
    border: none;
}
.list-group-item.active .text-muted {
  color: var(--text-color) !important;
  opacity: 0.8;
}
.chat-body {
    background-color: var(--background-color);
}
.message-animation {
  animation: message-fade-in 0.5s ease-out;
}
.message-bubble {
    padding: 12px 20px;
    border-radius: 20px;
    max-width: 75%;
    line-height: 1.5;
}
.user-message {
    background-color: #e9ecef;
    color: #333;
    border-bottom-right-radius: 5px;
}
.agent-message {
    background: linear-gradient(to right, #4A55A2, #7895CB);
    color: white;
    border-bottom-left-radius: 5px;
}
.chat-footer {
  background-color: var(--sidebar-bg);
  border-top: 1px solid var(--border-color);
}
.chat-footer .form-control {
  background-color: var(--background-color);
  border-radius: 1rem !important;
  transition: border-color 0.3s ease, box-shadow 0.3s ease; /* Add transition */
}
.chat-footer .form-control:focus {
  box-shadow: 0 0 0 0.25rem rgba(74, 85, 162, 0.25); /* Subtle glow on focus */
  border-color: var(--primary-color);
}
.btn-primary-custom {
    background-color: var(--primary-color);
    color: white;
    border-radius: 50% !important;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.3s ease;
}
.btn-primary-custom:hover {
    background-color: #3a448a;
}
.form-check-input:checked {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}
</style>
