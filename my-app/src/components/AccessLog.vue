<template>
  <div class="access-log-container p-4">
    <h4 class="mb-4 fw-bold">Nhật ký truy cập</h4>

    <!-- Search and Filter -->
    <div class="d-flex justify-content-between mb-4">
      <div class="input-group w-50">
        <span class="input-group-text border-0 bg-light"><i class="bi bi-search"></i></span>
        <input
          type="text"
          class="form-control border-0 bg-light"
          placeholder="Nhập từ khóa tìm kiếm..."
          v-model="searchQuery"
          @keyup.enter="fetchLogs"
        />
      </div>
      <div class="d-flex align-items-center">
        <label for="dateFilter" class="me-2 text-muted">Thời gian:</label>
        <select id="dateFilter" class="form-select w-auto" v-model="dateFilter" @change="applyDateFilter">
          <option value="all">Tất cả</option>
          <option value="today">Hôm nay</option>
          <option value="thisWeek">Tuần này</option>
          <option value="thisMonth">Tháng này</option>
        </select>
        <button class="btn btn-outline-secondary ms-2 refresh-btn" @click="fetchLogs">
          <i class="bi bi-arrow-clockwise"></i>
        </button>
      </div>
    </div>

    <!-- Access Log Table -->
    <div class="table-responsive">
      <table class="table table-hover align-middle">
        <thead>
          <tr>
            <th>Thời gian</th>
            <th>Người thực hiện</th>
            <th>Hành động</th>
            <th>Mô tả tham chiếu</th>
            <th>Thao tác</th> <!-- New column -->
          </tr>
        </thead>
        <tbody>
          <tr v-if="logs.length === 0">
            <td colspan="5" class="text-center text-muted py-3">Không có dữ liệu nhật ký truy cập.</td>
          </tr>
          <tr v-for="log in logs" :key="log.MaNhatKy" class="log-row">
            <td>{{ formatDate(log.ThoiGian) }}</td>
            <td>{{ log.Performer ? log.Performer.HoTen : 'N/A' }}</td> <!-- Changed to Performer -->
            <td>{{ log.HanhDong }}</td>
            <td>{{ log.GhiChu }}</td>
            <td>
              <button class="btn btn-sm btn-info me-2 edit-btn" @click="openEditModal(log)">
                <i class="bi bi-pencil"></i> Sửa
              </button>
              <button class="btn btn-sm btn-danger delete-btn" @click="deleteLog(log.MaNhatKy)">
                <i class="bi bi-trash"></i> Xóa
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="d-flex justify-content-between align-items-center mt-3">
      <small class="text-muted">Tổng số bản ghi {{ totalItems }}</small>
      <nav aria-label="Page navigation">
        <ul class="pagination pagination-sm mb-0">
          <li class="page-item" :class="{ disabled: currentPage === 1 }">
            <a class="page-link" href="#" @click.prevent="changePage(currentPage - 1)">Trước</a>
          </li>
          <li class="page-item" v-for="page in totalPages" :key="page" :class="{ active: currentPage === page }">
            <a class="page-link" href="#" @click.prevent="changePage(page)">{{ page }}</a>
          </li>
          <li class="page-item" :class="{ disabled: currentPage === totalPages }">
            <a class="page-link" href="#" @click.prevent="changePage(currentPage + 1)">Sau</a>
          </li>
        </ul>
      </nav>
      <div class="d-flex align-items-center">
        <label for="itemsPerPage" class="me-2 text-muted">Dòng/trang:</label>
        <select id="itemsPerPage" class="form-select w-auto" v-model="itemsPerPage" @change="fetchLogs">
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
        </select>
      </div>
    </div>

    <!-- Edit Log Modal -->
    <div class="modal fade" id="editLogModal" tabindex="-1" aria-labelledby="editLogModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="editLogModalLabel">Sửa Nhật ký truy cập</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveEditLog">
              <div class="mb-3">
                <label for="editMaNV" class="form-label">Mã Nhân viên</label>
                <input type="number" class="form-control" id="editMaNV" v-model="editingLog.MaNV" required>
              </div>
              <div class="mb-3">
                <label for="editMaPhienChat" class="form-label">Mã Phiên Chat</label>
                <input type="number" class="form-control" id="editMaPhienChat" v-model="editingLog.MaPhienChat">
              </div>
              <div class="mb-3">
                <label for="editHanhDong" class="form-label">Hành động</label>
                <input type="text" class="form-control" id="editHanhDong" v-model="editingLog.HanhDong" required>
              </div>
              <div class="mb-3">
                <label for="editGhiChu" class="form-label">Ghi chú</label>
                <textarea class="form-control" id="editGhiChu" rows="3" v-model="editingLog.GhiChu"></textarea>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                <button type="submit" class="btn btn-primary">Lưu thay đổi</button>
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
import { Modal } from 'bootstrap'; // Import Bootstrap's Modal

export default {
  name: 'AccessLog',
  data() {
    return {
      logs: [],
      searchQuery: '',
      dateFilter: 'all',
      currentPage: 1,
      itemsPerPage: 10,
      totalItems: 0,
      totalPages: 0,
      editingLog: { // Data for the edit modal
        MaNhatKy: null,
        MaNV: null,
        MaPhienChat: null,
        HanhDong: '',
        GhiChu: '',
      },
      editModal: null, // To store the Bootstrap modal instance
    };
  },
  mounted() {
    this.fetchLogs();
    this.editModal = new Modal(document.getElementById('editLogModal')); // Initialize modal
  },
  methods: {
    async fetchLogs() {
      try {
        let startDate = null;
        let endDate = null;

        const now = new Date();
        if (this.dateFilter === 'today') {
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1); // Up to start of next day
        } else if (this.dateFilter === 'thisWeek') {
          const dayOfWeek = now.getDay(); // Sunday - 0, Monday - 1, etc.
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 7);
        } else if (this.dateFilter === 'thisMonth') {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        }

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
        // Handle error, e.g., show a message to the user
      }
    },
    applyDateFilter() {
      this.currentPage = 1; // Reset page when filter changes
      this.fetchLogs();
    },
    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
        this.fetchLogs();
      }
    },
    formatDate(dateString) {
      const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' };
      return new Date(dateString).toLocaleDateString('vi-VN', options);
    },
    openEditModal(log) {
      // Create a deep copy to avoid modifying the table data directly
      this.editingLog = { ...log };
      this.editModal.show();
    },
    async saveEditLog() {
      try {
        await axios.put(`http://localhost:3000/api/access-logs/${this.editingLog.MaNhatKy}`, this.editingLog);
        this.editModal.hide();
        this.fetchLogs(); // Refresh the table
      } catch (error) {
        console.error('Error saving access log:', error);
        alert('Lỗi khi lưu nhật ký truy cập.');
      }
    },
    async deleteLog(id) {
      if (confirm('Bạn có chắc chắn muốn xóa nhật ký truy cập này không?')) {
        try {
          await axios.delete(`http://localhost:3000/api/access-logs/${id}`);
          this.fetchLogs(); // Refresh the table
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
.access-log-container {
  background-color: var(--background-color);
  min-height: 100%;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
}
.input-group .form-control, .form-select {
  border-radius: 0.375rem;
}
.table thead th {
  background-color: #e9ecef;
  font-weight: bold;
  padding: 12px 15px;
  border-bottom: 2px solid #dee2e6;
}
.table tbody tr {
  transition: background-color 0.3s ease;
}
.table tbody tr:hover {
  background-color: #f1f3f4; /* Lighter hover effect */
  transform: translateY(-2px); /* Slight lift effect */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Subtle shadow */
}
.pagination .page-item.active .page-link {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}
.pagination .page-link {
  color: var(--primary-color);
}
.pagination .page-link:hover {
  color: #0056b3;
}

/* Custom button styles for hover */
.edit-btn, .delete-btn, .refresh-btn {
  transition: all 0.3s ease;
  border-radius: 0.375rem;
}
.edit-btn:hover {
  background-color: #17a2b8; /* Darker info */
  color: white;
  transform: scale(1.05);
}
.delete-btn:hover {
  background-color: #dc3545; /* Darker danger */
  color: white;
  transform: scale(1.05);
}
.refresh-btn:hover {
  background-color: #6c757d; /* Darker secondary */
  color: white;
  transform: rotate(360deg);
}
</style>