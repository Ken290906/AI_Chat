<template>
  <div class="access-log-container h-100 d-flex flex-column bg-light p-4">
    
    <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
      <div>
        <h4 class="fw-bold mb-1 text-dark">Quản lý hệ thống</h4>
        <small class="text-muted">Xem nhật ký và phân tích hội thoại</small>
      </div>

      <ul class="nav nav-pills custom-tabs bg-white p-1 rounded-pill shadow-sm">
        <li class="nav-item">
          <a 
            class="nav-link d-flex align-items-center rounded-pill px-3" 
            :class="{ active: currentTab === 'access_logs' }" 
            href="#" 
            @click.prevent="switchTab('access_logs')"
          >
            <i class="bi bi-journal-text me-2"></i>
            <span>Nhật ký xử lý</span>
          </a>
        </li>
        <li class="nav-item">
          <a 
            class="nav-link d-flex align-items-center rounded-pill px-3" 
            :class="{ active: currentTab === 'chat_summaries' }" 
            href="#" 
            @click.prevent="switchTab('chat_summaries')"
          >
            <i class="bi bi-chat-square-text me-2"></i>
            <span>Tóm tắt hội thoại</span>
          </a>
        </li>
      </ul>
    </div>

    <div class="flex-grow-1 bg-white rounded-4 shadow-sm p-4 overflow-hidden d-flex flex-column">
      <transition name="fade" mode="out-in">
        
        <div v-if="currentTab === 'access_logs'" key="access_logs" class="h-100 d-flex flex-column">
          
          <div class="d-flex justify-content-between mb-4">
            <div class="input-group w-50 search-group">
              <span class="input-group-text bg-light border-0 ps-3">
                <i class="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                class="form-control bg-light border-0 py-2"
                placeholder="Tìm kiếm theo tên nhân viên, hành động..."
                v-model="searchQuery"
                @keyup.enter="fetchLogs"
              />
            </div>
            
            <div class="d-flex align-items-center gap-2">
              <select class="form-select border-0 bg-light py-2" v-model="dateFilter" @change="applyDateFilter" style="min-width: 150px;">
                <option value="all">Tất cả thời gian</option>
                <option value="today">Hôm nay</option>
                <option value="thisWeek">Tuần này</option>
                <option value="thisMonth">Tháng này</option>
              </select>
              <button class="btn btn-light rounded-circle p-2 refresh-btn" @click="fetchLogs" title="Làm mới">
                <i class="bi bi-arrow-clockwise text-primary"></i>
              </button>
            </div>
          </div>

          <div class="table-responsive flex-grow-1 custom-scrollbar">
            <table class="table table-hover align-middle custom-table">
              <thead class="sticky-top bg-white">
                <tr>
                  <th class="ps-4" style="width: 20%">Thời gian</th>
                  <th style="width: 20%">Người thực hiện</th>
                  <th style="width: 15%">Hành động</th>
                  <th style="width: 35%">Mô tả tham chiếu</th>
                  <th class="text-end pe-4" style="width: 10%">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="logs.length === 0">
                  <td colspan="5" class="text-center text-muted py-5">
                    <div class="py-5">
                      <i class="bi bi-inbox fs-1 d-block mb-3 opacity-25"></i>
                      <p>Không tìm thấy dữ liệu nhật ký nào.</p>
                    </div>
                  </td>
                </tr>
                <tr v-for="log in logs" :key="log.MaNhatKy" class="log-row">
                  <td class="ps-4 text-muted small fw-bold">{{ formatDate(log.ThoiGian) }}</td>
                  <td>
                    <div class="d-flex align-items-center">
                      <div class="avatar-placeholder me-2 rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center shadow-sm" style="width: 32px; height: 32px; font-size: 0.8rem; font-weight: bold;">
                        {{ log.Performer ? log.Performer.HoTen.charAt(0) : '?' }}
                      </div>
                      <span class="fw-medium text-dark">{{ log.Performer ? log.Performer.HoTen : 'N/A' }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="badge bg-light text-dark border px-3 py-2 rounded-pill fw-normal" style="font-size: 0.85rem;">
                      {{ log.HanhDong }}
                    </span>
                  </td>
                  <td>
                    <div class="text-muted text-truncate small" style="max-width: 350px;" :title="log.GhiChu">
                      {{ log.GhiChu }}
                    </div>
                  </td>
                  <td class="text-end pe-4">
                    <button class="btn btn-icon btn-sm btn-light text-primary me-2 shadow-sm" @click="openEditModal(log)" title="Sửa">
                      <i class="bi bi-pencil-fill" style="font-size: 0.8rem;"></i>
                    </button>
                    <button class="btn btn-icon btn-sm btn-light text-danger shadow-sm" @click="deleteLog(log.MaNhatKy)" title="Xóa">
                      <i class="bi bi-trash-fill" style="font-size: 0.8rem;"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="d-flex justify-content-between align-items-center pt-3 border-top mt-auto">
            <small class="text-muted">Đang hiển thị <b>{{ logs.length }}</b> trên tổng số <b>{{ totalItems }}</b> bản ghi</small>
            
            <div class="d-flex align-items-center gap-3">
              <nav>
                <ul class="pagination pagination-sm mb-0 shadow-sm rounded-3 overflow-hidden">
                  <li class="page-item" :class="{ disabled: currentPage === 1 }">
                    <a class="page-link border-0 px-3 py-2" href="#" @click.prevent="changePage(currentPage - 1)">
                      <i class="bi bi-chevron-left"></i>
                    </a>
                  </li>
                  <li class="page-item disabled">
                    <span class="page-link border-0 fw-bold text-dark bg-white px-3 py-2">Trang {{ currentPage }}</span>
                  </li>
                  <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                    <a class="page-link border-0 px-3 py-2" href="#" @click.prevent="changePage(currentPage + 1)">
                      <i class="bi bi-chevron-right"></i>
                    </a>
                  </li>
                </ul>
              </nav>

              <select class="form-select form-select-sm border-0 bg-white shadow-sm text-center" v-model="itemsPerPage" @change="fetchLogs" style="width: 70px; cursor: pointer;">
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
        </div>

        <div v-else-if="currentTab === 'chat_summaries'" key="chat_summaries" class="h-100 d-flex flex-column">
          
          <div class="d-flex justify-content-between mb-4">
             <div class="input-group w-50 search-group">
              <span class="input-group-text bg-light border-0 ps-3">
                <i class="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                class="form-control bg-light border-0 py-2"
                placeholder="Tìm nội dung tóm tắt, kết quả AI..."
                v-model="summarySearch"
                @keyup.enter="fetchChatSummaries"
              />
            </div>

            <div class="d-flex align-items-center gap-2">
               <select class="form-select border-0 bg-light py-2" v-model="summaryDateFilter" @change="applySummaryDateFilter" style="min-width: 150px;">
                <option value="all">Tất cả thời gian</option>
                <option value="today">Hôm nay</option>
                <option value="thisWeek">Tuần này</option>
                <option value="thisMonth">Tháng này</option>
              </select>

              <button class="btn btn-light rounded-circle p-2 refresh-btn" @click="fetchChatSummaries" title="Làm mới">
                <i class="bi bi-arrow-clockwise text-primary"></i>
              </button>
            </div>
          </div>

          <div class="table-responsive flex-grow-1 custom-scrollbar">
            <table class="table table-hover align-middle custom-table">
              <thead class="sticky-top bg-white">
                <tr>
                  <th class="ps-4" style="width: 10%">Mã Phiên</th>
                  <th style="width: 50%">Nội dung Tóm tắt</th>
                  <th style="width: 20%">Kết quả AI</th>
                  <th class="text-end pe-4" style="width: 20%">Thời gian tạo</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="summaries.length === 0">
                  <td colspan="4" class="text-center text-muted py-5">
                    <div class="py-5">
                      <i class="bi bi-chat-square-dots fs-1 d-block mb-3 opacity-25"></i>
                      <p>Chưa có dữ liệu tóm tắt nào.</p>
                    </div>
                  </td>
                </tr>
                <tr v-for="item in summaries" :key="item.MaPhienChat" class="log-row">
                  <td class="ps-4 fw-bold text-primary">#{{ item.MaPhienChat }}</td>
                  <td>
                    <div class="text-dark" style="font-size: 0.95rem; line-height: 1.5;">
                      {{ item.NoiDungTomTat || 'Chưa có tóm tắt' }}
                    </div>
                  </td>
                  <td>
                    <span 
                      class="badge border px-3 py-2 rounded-pill fw-normal"
                      :class="getBadgeClass(item.KetQuaTuAI)"
                    >
                      {{ item.KetQuaTuAI || 'Chưa đánh giá' }}
                    </span>
                  </td>
                  <td class="text-end pe-4 text-muted small fw-bold">
                    {{ formatDate(item.ThoiGianTao) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
           <div class="d-flex justify-content-between align-items-center pt-3 border-top mt-auto">
            <small class="text-muted">Đang hiển thị <b>{{ summaries.length }}</b> trên tổng số <b>{{ summaryTotalItems }}</b> bản ghi</small>
            
            <div class="d-flex align-items-center gap-3">
              <nav>
                <ul class="pagination pagination-sm mb-0 shadow-sm rounded-3 overflow-hidden">
                  <li class="page-item" :class="{ disabled: summaryPage === 1 }">
                    <a class="page-link border-0 px-3 py-2" href="#" @click.prevent="changeSummaryPage(summaryPage - 1)">
                      <i class="bi bi-chevron-left"></i>
                    </a>
                  </li>
                  <li class="page-item disabled">
                    <span class="page-link border-0 fw-bold text-dark bg-white px-3 py-2">Trang {{ summaryPage }}</span>
                  </li>
                  <li class="page-item" :class="{ disabled: summaryPage === summaryTotalPages }">
                    <a class="page-link border-0 px-3 py-2" href="#" @click.prevent="changeSummaryPage(summaryPage + 1)">
                      <i class="bi bi-chevron-right"></i>
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>

        </div>

      </transition>
    </div>

    <div class="modal fade" id="editLogModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg rounded-4">
          <div class="modal-header border-bottom-0 pb-0">
            <h5 class="modal-title fw-bold">Sửa Nhật ký</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body pt-4">
            <form @submit.prevent="saveEditLog">
              <div class="mb-3">
                <label class="form-label text-muted small fw-bold text-uppercase">Mã NV</label>
                <input type="number" class="form-control bg-light border-0" v-model="editingLog.MaNV" required>
              </div>
              <div class="mb-3">
                <label class="form-label text-muted small fw-bold text-uppercase">Mã Phiên</label>
                <input type="number" class="form-control bg-light border-0" v-model="editingLog.MaPhienChat">
              </div>
              <div class="mb-3">
                <label class="form-label text-muted small fw-bold text-uppercase">Hành động</label>
                <input type="text" class="form-control bg-light border-0" v-model="editingLog.HanhDong" required>
              </div>
              <div class="mb-4">
                <label class="form-label text-muted small fw-bold text-uppercase">Ghi chú</label>
                <textarea class="form-control bg-light border-0" rows="3" v-model="editingLog.GhiChu"></textarea>
              </div>
              <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-light rounded-pill px-4" data-bs-dismiss="modal">Hủy</button>
                <button type="submit" class="btn btn-primary rounded-pill px-4">Lưu lại</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { Modal } from 'bootstrap';

export default {
  name: 'AccessLog',
  data() {
    return {
      currentTab: 'access_logs',
      
      // Data for Tab 1 (Access Logs)
      logs: [],
      searchQuery: '',
      dateFilter: 'all',
      currentPage: 1,
      itemsPerPage: 10,
      totalItems: 0,
      totalPages: 0,
      editingLog: { MaNhatKy: null, MaNV: null, MaPhienChat: null, HanhDong: '', GhiChu: '' },
      editModal: null,

      // Data for Tab 2 (Chat Summaries)
      summaries: [],
      summaryPage: 1,
      summaryTotalItems: 0,
      summaryTotalPages: 0,
      summarySearch: '',
      summaryDateFilter: 'all',
    };
  },
  mounted() {
    this.fetchLogs();
    this.editModal = new Modal(document.getElementById('editLogModal'));
  },
  methods: {
    // --- Switch Tab & Load Data ---
    switchTab(tabName) {
      this.currentTab = tabName;
      if (tabName === 'chat_summaries') {
        this.fetchChatSummaries();
      } else {
        this.fetchLogs();
      }
    },

    // --- TAB 1: ACCESS LOGS LOGIC ---
    async fetchLogs() {
      try {
        const { startDate, endDate } = this.getDateRange(this.dateFilter);
        const params = {
          page: this.currentPage,
          limit: this.itemsPerPage,
          search: this.searchQuery,
          ...(startDate && { startDate: startDate.toISOString() }),
          ...(endDate && { endDate: endDate.toISOString() }),
        };

        const response = await axios.get('http://localhost:3000/api/access-logs', { params });
        this.logs = response.data.data;
        this.totalItems = response.data.totalItems;
        this.totalPages = response.data.totalPages;
      } catch (error) {
        console.error('Error fetching access logs:', error);
      }
    },
    
    // --- TAB 2: CHAT SUMMARIES LOGIC ---
    async fetchChatSummaries() {
      try {
        const { startDate, endDate } = this.getDateRange(this.summaryDateFilter);
        const params = {
          page: this.summaryPage,
          limit: 10, // Cố định 10 hoặc tạo biến riêng nếu muốn
          search: this.summarySearch,
          ...(startDate && { startDate: startDate.toISOString() }),
          ...(endDate && { endDate: endDate.toISOString() }),
        };

        const response = await axios.get('http://localhost:3000/api/chat-summaries', { params });
        this.summaries = response.data.data;
        this.summaryTotalItems = response.data.totalItems;
        this.summaryTotalPages = response.data.totalPages;
      } catch (error) {
        console.error('Error fetching chat summaries:', error);
      }
    },

    // --- Helper Methods ---
    getDateRange(filterType) {
        const now = new Date();
        let startDate = null;
        let endDate = null;

        if (filterType === 'today') {
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        } else if (filterType === 'thisWeek') {
          const dayOfWeek = now.getDay();
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 7);
        } else if (filterType === 'thisMonth') {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        }
        return { startDate, endDate };
    },

    applyDateFilter() {
      this.currentPage = 1;
      this.fetchLogs();
    },
    applySummaryDateFilter() {
      this.summaryPage = 1;
      this.fetchChatSummaries();
    },
    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
        this.fetchLogs();
      }
    },
    changeSummaryPage(page) {
      if (page >= 1 && page <= this.summaryTotalPages) {
        this.summaryPage = page;
        this.fetchChatSummaries();
      }
    },
    formatDate(dateString) {
      if (!dateString) return '';
      const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
      return new Date(dateString).toLocaleDateString('vi-VN', options);
    },
    getBadgeClass(status) {
      if (!status) return 'bg-light text-dark';
      const s = status.toLowerCase();
      // Logic màu sắc cho AI result
      if (s.includes('tích cực') || s.includes('positive') || s.includes('thành công')) return 'bg-success bg-opacity-10 text-success';
      if (s.includes('tiêu cực') || s.includes('negative') || s.includes('thất bại')) return 'bg-danger bg-opacity-10 text-danger';
      if (s.includes('trung tính') || s.includes('neutral') || s.includes('đang chờ')) return 'bg-warning bg-opacity-10 text-warning';
      return 'bg-info bg-opacity-10 text-info';
    },

    // --- Modal Logic (Access Log) ---
    openEditModal(log) {
      this.editingLog = { ...log };
      this.editModal.show();
    },
    async saveEditLog() {
      try {
        await axios.put(`http://localhost:3000/api/access-logs/${this.editingLog.MaNhatKy}`, this.editingLog);
        this.editModal.hide();
        this.fetchLogs();
      } catch (error) {
        console.error('Error saving access log:', error);
        alert('Lỗi khi lưu nhật ký truy cập.');
      }
    },
    async deleteLog(id) {
      if (confirm('Bạn có chắc chắn muốn xóa nhật ký truy cập này không?')) {
        try {
          await axios.delete(`http://localhost:3000/api/access-logs/${id}`);
          this.fetchLogs();
        } catch (error) {
          console.error('Error deleting access log:', error);
          alert('Lỗi khi xóa nhật ký truy cập.');
        }
      }
    },
  },
};
</script>

<style scoped>
/* --- 1. Animation giống Sidebar --- */
@keyframes active-pulse {
  0% { box-shadow: 0 0 0 0 rgba(var(--primary-rgb, 13, 110, 253), 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(var(--primary-rgb, 13, 110, 253), 0); }
  100% { box-shadow: 0 0 0 0 rgba(var(--primary-rgb, 13, 110, 253), 0); }
}

/* --- 2. Custom Tabs (Pills) --- */
.custom-tabs .nav-link {
  color: var(--text-color, #6c757d);
  font-weight: 500;
  border-radius: 0.5rem; /* Bo góc giống Sidebar */
  padding: 0.6rem 1.2rem;
  transition: all 0.3s ease;
}

.custom-tabs .nav-link:hover {
  background-color: rgba(0,0,0,0.05);
}

.custom-tabs .nav-link.active {
  background-color: var(--primary-color, #0d6efd);
  color: white !important;
  animation: active-pulse 1.5s infinite ease-out; /* Hiệu ứng Pulse */
  box-shadow: 0 4px 10px rgba(var(--primary-rgb, 13, 110, 253), 0.3);
}

/* --- 3. Table Styling --- */
.custom-table thead th {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #adb5bd;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 1rem;
}

.custom-table tbody td {
  padding-top: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f8f9fa;
  font-size: 0.9rem;
}

.log-row:hover {
  background-color: #f8f9fa; /* Màu hover nhẹ */
}

.log-row:hover td {
  color: var(--primary-color, #0d6efd); /* Đổi màu chữ khi hover */
  transition: color 0.2s;
}

/* --- 4. Inputs & Search --- */
.search-group .input-group-text {
  border-top-left-radius: 20px;
  border-bottom-left-radius: 20px;
}
.search-group .form-control {
  border-top-right-radius: 20px;
  border-bottom-right-radius: 20px;
}
.form-control:focus, .form-select:focus {
  box-shadow: none;
  background-color: #fff;
}

/* --- 5. Buttons --- */
.btn-icon {
  width: 32px;
  height: 32px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: transform 0.2s;
}
.btn-icon:hover {
  transform: scale(1.1);
}
.refresh-btn {
  transition: transform 0.5s ease;
}
.refresh-btn:hover {
  transform: rotate(180deg);
  background-color: #e9ecef;
}

/* --- 6. Transitions --- */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Scrollbar tùy chỉnh cho bảng */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #dee2e6;
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #adb5bd;
}
</style>