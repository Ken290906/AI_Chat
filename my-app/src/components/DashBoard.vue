<template>
  <div class="dashboard-container">
    <!-- Header -->
    <div class="dashboard-header">
      <h2 class="dashboard-title">Tổng quan</h2>
      <div class="header-actions">
        <button class="btn btn-outline">
          <i class="bi bi-download"></i>
          Xuất báo cáo
        </button>
        <button class="btn btn-primary">
          <i class="bi bi-plus-circle"></i>
          Tạo cảnh báo
        </button>
      </div>
    </div>

    <!-- KPI Stats Grid -->
    <div class="kpi-grid">
      <div class="kpi-card warning">
        <div class="kpi-content">
          <div class="kpi-icon">
            <i class="bi bi-exclamation-triangle"></i>
          </div>
          <div class="kpi-info">
            <h3>{{ totalWarnings }}</h3>
            <p>Cảnh báo trong ngày</p>
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

    <!-- Charts Section -->
    <div class="charts-section">
      <!-- Phân loại cảnh báo theo nội dung -->
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

      <!-- Phân loại cảnh báo theo kênh -->
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

    <!-- Recent Alerts -->
    <div class="recent-section">
      <div class="recent-card">
        <div class="chart-header">
          <h4>Cảnh báo gần đây</h4>
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

const totalChats = ref(0);
const totalMessages = ref(0);
const totalCustomers = ref(0);
const totalWarnings = ref(0);
const chatsOverTime = ref([]);
const chatStatusDistribution = ref([]);
const recentChats = ref([]);
const topEmployees = ref([]);
const warningTypes = ref([]);
const recentActivities = ref([]);

const API_BASE_URL = 'http://localhost:3000/api/dashboard';

const fetchData = async () => {
  try {
    const [
      totalChatsRes,
      totalMessagesRes,
      totalCustomersRes,
      totalWarningsRes,
      chatsOverTimeRes,
      chatStatusDistributionRes,
      recentChatsRes,
      topEmployeesRes,
      warningTypesRes,
      recentActivitiesRes,
    ] = await Promise.all([
      axios.get(`${API_BASE_URL}/total-chats`),
      axios.get(`${API_BASE_URL}/total-messages`),
      axios.get(`${API_BASE_URL}/total-customers`),
      axios.get(`${API_BASE_URL}/total-warnings`),
      axios.get(`${API_BASE_URL}/chats-over-time`),
      axios.get(`${API_BASE_URL}/chat-status-distribution`),
      axios.get(`${API_BASE_URL}/recent-chats`),
      axios.get(`${API_BASE_URL}/top-employees`),
      axios.get(`${API_BASE_URL}/warning-types`),
      axios.get(`${API_BASE_URL}/recent-activities`),
    ]);

    totalChats.value = totalChatsRes.data.totalChats;
    totalMessages.value = totalMessagesRes.data.totalMessages;
    totalCustomers.value = totalCustomersRes.data.totalCustomers;
    totalWarnings.value = totalWarningsRes.data.totalWarnings;
    chatsOverTime.value = chatsOverTimeRes.data;
    
    const statusColors = {
      'DangCho': '#ffc107',
      'DangHoatDong': '#17a2b8',
      'DaKetThuc': '#28a745',
    };
    const totalStatusCount = chatStatusDistributionRes.data.reduce((sum, item) => sum + item.count, 0);
    chatStatusDistribution.value = chatStatusDistributionRes.data.map(item => ({
      ...item,
      percentage: totalStatusCount > 0 ? ((item.count / totalStatusCount) * 100).toFixed(2) : 0,
      color: statusColors[item.TrangThai] || '#ccc',
    }));

    recentChats.value = recentChatsRes.data;
    topEmployees.value = topEmployeesRes.data;
    
    const warningColors = ['#ffc107', '#17a2b8', '#28a745', '#dc3545'];
    let offset = 0;
    warningTypes.value = warningTypesRes.data.map((item, index) => {
      const currentOffset = offset;
      offset += item.value;
      return {
        ...item,
        offset: currentOffset,
        color: warningColors[index % warningColors.length],
      };
    });

    recentActivities.value = recentActivitiesRes.data;

  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
  }
};

onMounted(fetchData);
</script>

<style scoped>
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
  background: conic-gradient(
    var(--color) calc(var(--offset) * 1%) calc(var(--value) * 1%)
  );
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