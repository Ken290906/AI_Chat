<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h2 class="dashboard-title">Tổng quan</h2>
      <div class="header-actions">
        <button class="btn btn-outline" @click="exportReport">
          <i class="bi bi-download"></i>
          Xuất báo cáo
        </button>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card warning">
        <div class="kpi-content">
          <div class="kpi-icon">
            <i class="bi bi-exclamation-triangle"></i>
          </div>
          <div class="kpi-info">
            <h3>{{ totalWarnings }}</h3>
            <p>tổng số cảnh báo</p>
          </div>
        </div>
      </div>

      <div class="kpi-card info">
        <div class="kpi-content">
          <div class="kpi-icon">
            <i class="bi bi-chat-dots"></i>
          </div>
          <div class="kpi-info">
            <h3>{{ totalChats }}</h3>
            <p>Hội thoại xử lý</p>
          </div>
        </div>
      </div>

      <div class="kpi-card success">
        <div class="kpi-content">
          <div class="kpi-icon">
            <i class="bi bi-people"></i>
          </div>
          <div class="kpi-info">
            <h3>{{ totalCustomers }}</h3>
            <p>Tổng số khách hàng</p>
          </div>
        </div>
      </div>

      <div class="kpi-card primary">
        <div class="kpi-content">
          <div class="kpi-icon">
            <i class="bi bi-envelope"></i>
          </div>
          <div class="kpi-info">
            <h3>{{ totalMessages }}</h3>
            <p>Tổng số tin nhắn</p>
          </div>
        </div>
      </div>
    </div>

    <div class="charts-section">
      <div class="chart-card">
        <div class="chart-header">
          <h4>Phân loại cảnh báo theo nội dung</h4>
        </div>
        <div class="chart-content">
          <div class="chart-visual">
            <div class="pie-chart">
              <div v-for="(item, index) in warningTypes" :key="index" :class="'pie-segment segment-' + (index + 1)" :style="{ '--offset': item.offset, '--value': item.value, '--color': item.color }"></div>
              <div class="pie-center">
                <span>100%</span>
              </div>
            </div>
          </div>
          <div class="chart-legend">
            <div v-for="(item, index) in warningTypes" :key="index" class="legend-item">
              <span class="legend-color" :style="{ backgroundColor: item.color }"></span>
              <span class="legend-text">{{ item.name }}</span>
              <span class="legend-value">{{ item.value }}%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <h4>Phân phối trạng thái phiên chat</h4>
        </div>
        <div class="chart-content">
          <div class="bar-chart">
            <div class="bar-container">
              <div v-for="(item, index) in chatStatusDistribution" :key="index" class="bar-item">
                <div class="bar-label">{{ item.TrangThai }}</div>
                <div class="bar-track">
                  <div class="bar-fill" :style="{ width: item.percentage + '%', backgroundColor: item.color }"></div>
                </div>
                <div class="bar-value">{{ item.count }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="recent-section">
      <div class="recent-card">
        <div class="chart-header">
          <h4>Hoạt động gần đây</h4>
          <button class="btn-text">Xem tất cả</button>
        </div>
        <div class="recent-list">
          <div v-for="activity in recentActivities" :key="activity.MaNhatKy" class="recent-item">
            <div class="recent-icon warning">
              <i class="bi bi-exclamation-triangle"></i>
            </div>
            <div class="recent-content">
              <p class="recent-title">{{ activity.HanhDong }}</p>
              <span class="recent-time">{{ new Date(activity.ThoiGian).toLocaleString() }}</span>
            </div>
            <div class="recent-badge">{{ activity.Performer.HoTen }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

// Khai báo Ref
const totalChats = ref(0);
const totalMessages = ref(0);
const totalCustomers = ref(0);
const totalWarnings = ref(0);
const chatStatusDistribution = ref([]);
const warningTypes = ref([]);
const recentActivities = ref([]);

const API_BASE_URL = 'http://localhost:3000/api/dashboard';

// Ánh xạ màu cho trạng thái chat
const STATUS_COLORS = {
  'DangCho': '#ffc107',
  'DangHoatDong': '#17a2b8',
  'DaKetThuc': '#28a745',
};

// Hàm lấy dữ liệu Dashboard
const fetchData = async () => {
  try {
    // Tối ưu: Chỉ lấy các API cần thiết cho việc hiển thị (loại bỏ các ref không dùng trên UI)
    const endpoints = [
      'total-chats', 'total-messages', 'total-customers', 'total-warnings',
      'chat-status-distribution', 'warning-types', 'recent-activities'
    ];
    
    const requests = endpoints.map(endpoint => axios.get(`${API_BASE_URL}/${endpoint}`));
    const responses = await Promise.all(requests);

    // Xử lý dữ liệu
    totalChats.value = responses[0].data.totalChats;
    totalMessages.value = responses[1].data.totalMessages;
    totalCustomers.value = responses[2].data.totalCustomers;
    totalWarnings.value = responses[3].data.totalWarnings;

    // Xử lý Phân phối trạng thái chat
    const chatStatusData = responses[4].data;
    const totalStatusCount = chatStatusData.reduce((sum, item) => sum + item.count, 0);
    chatStatusDistribution.value = chatStatusData.map(item => ({
      ...item,
      percentage: totalStatusCount > 0 ? ((item.count / totalStatusCount) * 100).toFixed(2) : 0,
      color: STATUS_COLORS[item.TrangThai] || '#ccc',
    }));

    // Xử lý Phân loại cảnh báo
    const warningTypeData = responses[5].data;
    const warningColors = ['#ffc107', '#17a2b8', '#28a745', '#dc3545'];
    let accumulatedOffset = 0;
    warningTypes.value = warningTypeData.map((item, index) => {
      // item.value hiện tại đang là số lượng (count) từ API
      const count = item.value; 
      const total = totalWarnings.value;
      
      // Tính tỷ lệ phần trăm thực tế
      const percentage = total > 0 ? parseFloat(((count / total) * 100).toFixed(2)) : 0;
      
      const currentOffset = accumulatedOffset;
      accumulatedOffset += percentage;

      return {
        name: item.name, // "Kỹ thuật" hoặc "Người dùng"
        count: count,    // Lưu số lượng thực tế để hiển thị nếu cần
        value: percentage, // Giá trị phần trăm để vẽ biểu đồ
        offset: currentOffset,
        color: warningColors[index % warningColors.length],
      };
    });

    // Xử lý Hoạt động gần đây
    recentActivities.value = responses[6].data;

  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu Dashboard:', error);
  }
};

// Hàm xuất báo cáo Excel (Giữ nguyên)
const exportReport = async () => {
  try {
    // Gọi API xuất báo cáo (API này đã được thêm vào dashboard.js ở bước trước)
    const response = await axios.get(`${API_BASE_URL}/export-report`, {
      responseType: 'blob', // Quan trọng: Đặt kiểu phản hồi là 'blob' để nhận dữ liệu file
    });

    // Tạo URL đối tượng blob
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Lấy tên file từ header Content-Disposition
    const contentDisposition = response.headers['content-disposition'];
    let fileName = 'BaoCaoTongHopHoatDong.xlsx';
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="(.+)"/i);
      if (fileNameMatch && fileNameMatch.length === 2) {
        // Chỉ lấy tên file nếu khớp
        fileName = fileNameMatch[1].replace(/['"]/g, ''); // Loại bỏ dấu nháy kép/đơn
      }
    }

    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove(); // Xóa liên kết sau khi tải
    window.URL.revokeObjectURL(url); // Giải phóng bộ nhớ
    
    console.log('Xuất báo cáo thành công!');
    
  } catch (error) {
    console.error('Lỗi khi xuất báo cáo:', error);
    alert('Không thể xuất báo cáo. Vui lòng kiểm tra console.');
  }
};

onMounted(fetchData);
</script>

<style scoped>
/* Tất cả các ký tự khoảng trắng không phải ASCII đã được thay thế bằng khoảng trắng tiêu chuẩn */
.dashboard-container {
  padding: 20px;
  background: var(--background-color);
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.dashboard-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: white;
  color: var(--text-color);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:hover {
  background: var(--accent-color);
}

.btn-primary {
  background: var(--primary-color);
  color: white;
  border: none;
}

.btn-primary:hover {
  background: #3a448a;
}

.btn-outline {
  border: 1px solid var(--border-color);
}

.btn-text {
  background: none;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-icon {
  background: none;
  border: none;
  color: var(--text-color);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.btn-icon:hover {
  background: var(--accent-color);
}

/* KPI Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 10px;
}

.kpi-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  border-left: 4px solid;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.kpi-card.warning { border-left-color: #ffc107; }
.kpi-card.info { border-left-color: #17a2b8; }
.kpi-card.success { border-left-color: #28a745; }
.kpi-card.primary { border-left-color: var(--primary-color); }

.kpi-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.kpi-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.kpi-card.warning .kpi-icon { background: #fff3cd; color: #ffc107; }
.kpi-card.info .kpi-icon { background: #d1ecf1; color: #17a2b8; }
.kpi-card.success .kpi-icon { background: #d4edda; color: #28a745; }
.kpi-card.primary .kpi-icon { background: var(--accent-color); color: var(--primary-color); }

.kpi-info h3 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-color);
}

.kpi-info p {
  margin: 0;
  font-size: 0.875rem;
  color: #6c757d;
}

.kpi-trend {
  font-size: 0.875rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 12px;
}

.kpi-trend.up { background: #d4edda; color: #155724; }
.kpi-trend.down { background: #f8d7da; color: #721c24; }

/* Charts Section */
.charts-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.chart-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-header h4 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-color);
}

.chart-actions {
  display: flex;
  gap: 8px;
}

.chart-content {
  display: flex;
  gap: 20px;
  align-items: center;
}

/* Pie Chart */
.pie-chart {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  /* background: conic-gradient( */
  /* var(--color) calc(var(--offset) * 1%) calc(var(--value) * 1%) */
  /* ); */
  position: relative;
}

.pie-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
}

/* Bar Chart */
.bar-chart {
  flex: 1;
}

.bar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.bar-label {
  width: 80px;
  font-size: 0.875rem;
  color: var(--text-color);
}

.bar-track {
  flex: 1;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
}

.bar-value {
  width: 40px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-color);
}

/* Chart Legend */
.chart-legend {
  flex: 1;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-text {
  flex: 1;
  font-size: 0.875rem;
  color: var(--text-color);
}

.legend-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-color);
}

/* Recent Section */
.recent-section {
  margin-top: 10px;
}

.recent-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.recent-item:hover {
  background: var(--accent-color);
}

.recent-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
}

.recent-icon.warning { background: #fff3cd; color: #ffc107; }
.recent-icon.info { background: #d1ecf1; color: #17a2b8; }
.recent-icon.success { background: #d4edda; color: #28a745; }

.recent-content {
  flex: 1;
}

.recent-title {
  font-size: 0.875rem;
  font-weight: 500;
  margin: 0 0 4px 0;
  color: var(--text-color);
}

.recent-time {
  font-size: 0.75rem;
  color: #6c757d;
}

.recent-badge {
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 12px;
  background: var(--accent-color);
  color: var(--primary-color);
  font-weight: 500;
}

/* Responsive */
@media (max-width: 1200px) {
  .charts-section {
    grid-template-columns: 1fr;
  }
  
  .chart-content {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .header-actions {
    justify-content: flex-end;
  }
  
  .kpi-grid {
    grid-template-columns: 1fr;
  }
}
</style>