<template>
  <div class="client-chat-container d-flex flex-column" style="height: 100vh; width: 100vw;">
    <!-- Chat Header -->
    <div class="chat-header p-3 border-bottom d-flex align-items-center">
      <img src="https://i.pravatar.cc/40?u=at" class="rounded-circle me-3" alt="AT">
      <div>
        <h6 class="mb-0 fw-bold">AT</h6>
        <small class="text-muted">Nhân viên bán hàng</small>
      </div>
    </div>

    <!-- Chat Body -->
    <div class="chat-body flex-grow-1 p-3 overflow-auto">
      <!-- User Message -->
      <div class="d-flex justify-content-end mb-3">
        <div class="message-bubble user-message">
          hello
        </div>
      </div>

      <!-- Agent Message -->
      <div class="d-flex justify-content-start mb-3">
        <img src="https://i.pravatar.cc/32?u=agent" class="rounded-circle me-2 agent-avatar" alt="Agent">
        <div class="message-content">
          <div class="message-bubble agent-message">
            Dạ chào bạn ạ! Mình có thể hỗ trợ gì cho bạn hôm nay ạ?
          </div>
          <div class="text-muted small mt-1">
            <i class="bi bi-arrow-clockwise"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Chat Footer (Input Area) -->
    <div class="chat-footer p-3 border-top">
      <div class="input-group">
        <button class="btn btn-outline-secondary border-0" type="button"><i class="bi bi-plus-lg"></i></button>
        <input type="text" class="form-control border-0" placeholder="Nhập câu hỏi của bạn tại đây...">
        <button class="btn btn-outline-secondary border-0" type="button"><i class="bi bi-mic-fill"></i></button>
        <button class="btn btn-outline-secondary border-0" type="button"><i class="bi bi-google"></i></button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ClientChat'
}
</script>

<style scoped>
.client-chat-container {
  background-color: #f8f9fa;
}

.chat-header {
  background-color: white;
  height: 70px;
}

.chat-body {
  background-color: #e9ecef;
  flex: 1;
}

.message-bubble {
  padding: 10px 15px;
  border-radius: 1rem;
  max-width: 75%;
  word-wrap: break-word;
}

.user-message {
  background-color: #e0f2f7; /* Light blue */
  color: #333;
}

.agent-message {
  background-color: white;
  color: #333;
}

.agent-avatar {
  width: 32px;
  height: 32px;
  object-fit: cover;
  border: 2px solid #e9ecef;
  flex-shrink: 0;
}

.chat-footer {
  background-color: white;
  padding: 20px;
}

.chat-footer .input-group {
  max-width: none;
}

.chat-footer .input-group .form-control {
  border-radius: 1rem !important;
  background-color: #f1f3f4;
  padding: 12px 20px;
  font-size: 14px;
}

.chat-footer .input-group .btn {
  border-radius: 1rem !important;
  background-color: #f1f3f4;
  border: none;
  color: #666;
  margin: 0 5px;
}

.chat-footer .input-group .btn:hover {
  background-color: #e1e3e4;
}
</style>
