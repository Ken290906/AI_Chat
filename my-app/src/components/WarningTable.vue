<template>
  <div class="container-fluid p-4">
    <h2 class="mb-4">Bảng Cảnh Báo</h2>
    <div class="card shadow-sm">
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead class="table-light">
              <tr>
                <th scope="col">Mã CB</th>
                <th scope="col">Tên Cảnh Báo</th>
                <th scope="col">Phân Loại</th>
                <th scope="col">Ghi Chú</th>
                <th scope="col">Thời Gian Tạo</th>
                <th scope="col">Mã Phiên Chat</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="warning in warnings" :key="warning.MaCB" :class="getWarningClass(warning.PhanLoaiCanhBao.PhanLoai)">
                <td>{{ warning.MaCB }}</td>
                <td>{{ warning.TenCB }}</td>
                <td>
                  <span :class="getBadgeClass(warning.PhanLoaiCanhBao.PhanLoai)">
                    <i :class="getIconClass(warning.PhanLoaiCanhBao.PhanLoai)"></i>
                    {{ warning.PhanLoaiCanhBao.PhanLoai }}
                  </span>
                </td>
                <td>{{ warning.GhiChu }}</td>
                <td>{{ new Date(warning.ThoiGianTao).toLocaleString() }}</td>
                <td>{{ warning.MaPhienChat }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'WarningTable',
  data() {
    return {
      warnings: [],
    };
  },
  async mounted() {
    try {
      const response = await axios.get('http://localhost:3000/api/dashboard/warnings');
      this.warnings = response.data;
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu cảnh báo:', error);
    }
  },
  methods: {
    getWarningClass(level) {
      if (level === 'Cao') return 'table-danger';
      if (level === 'Trung bình') return 'table-warning';
      if (level === 'Thấp') return 'table-info';
      return '';
    },
    getBadgeClass(level) {
      if (level === 'Cao') return 'badge bg-danger-soft text-danger';
      if (level === 'Trung bình') return 'badge bg-warning-soft text-warning';
      if (level === 'Thấp') return 'badge bg-info-soft text-info';
      return 'badge bg-secondary-soft text-secondary';
    },
    getIconClass(level) {
      if (level === 'Cao') return 'bi bi-exclamation-octagon-fill me-1';
      if (level === 'Trung bình') return 'bi bi-exclamation-triangle-fill me-1';
      if (level === 'Thấp') return 'bi bi-info-circle-fill me-1';
      return 'bi bi-question-circle-fill me-1';
    }
  }
}
</script>

<style scoped>
.container-fluid {
  background-color: #f0f2f5;
}
h2 {
  color: #343a40;
  font-weight: 600;
}
.card {
  border: none;
  border-radius: 0.75rem;
}
.table {
  margin-bottom: 0;
}
.table thead th {
  border-bottom-width: 1px;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 0.5px;
}
.table tbody tr:hover {
  background-color: #f8f9fa;
}
.badge {
  padding: 0.5em 0.75em;
  font-size: 0.8rem;
  font-weight: 500;
}
.bg-danger-soft {
  background-color: rgba(220, 53, 69, 0.1);
}
.text-danger {
  color: #dc3545 !important;
}
.bg-warning-soft {
  background-color: rgba(255, 193, 7, 0.1);
}
.text-warning {
  color: #ffc107 !important;
}
.bg-info-soft {
  background-color: rgba(13, 202, 240, 0.1);
}
.text-info {
  color: #0dcaf0 !important;
}
.bg-secondary-soft {
  background-color: rgba(108, 117, 125, 0.1);
}
.text-secondary {
  color: #6c757d !important;
}
</style>
