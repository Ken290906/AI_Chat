<template>
  <div class="login-container">
    <div class="login-box">
      <h1>Đăng nhập nhân viên</h1>
      <form @submit.prevent="login">
        <div class="form-group">
          <label for="employeeId">ID nhân viên:</label>
          <input 
            v-model="employeeId" 
            type="text" 
            id="employeeId" 
            placeholder="Nhập ID nhân viên" 
          />
        </div>

        <div class="form-group">
          <label for="password">Mật khẩu:</label>
          <input 
            v-model="password" 
            type="password" 
            id="password" 
            placeholder="Nhập mật khẩu" 
          />
        </div>

        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
        </button>

        <!-- Added error message display -->
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'EmployeeLogin',
  data() {
    return {
      employeeId: '',
      password: '',
      isLoading: false,
      errorMessage: ''
    };
  },
  methods: {
    async login() {
      if (!this.employeeId || !this.password) {
        this.errorMessage = 'Vui lòng nhập ID nhân viên và mật khẩu';
        return;
      }

      this.isLoading = true;
      this.errorMessage = '';

      try {
        const res = await axios.post('http://localhost:3000/api/auth/employee/login', {
          employeeId: this.employeeId,
          password: this.password
        });

        if (res.data.success) {
          localStorage.setItem('employee', JSON.stringify(res.data.employee));
          localStorage.setItem('isLoggedIn', 'true');

          this.$router.push({ name: 'Dashboard' });
        } else {
          this.errorMessage = res.data.error || "Thông tin đăng nhập không hợp lệ";
        }

      } catch (err) {
        this.errorMessage = "Đăng nhập thất bại: " + (err.response?.data?.error || "Lỗi server");
      } finally {
        this.isLoading = false;
      }
    }
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
}

.login-box h1 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 5px rgba(102, 126, 234, 0.1);
}

button {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

button:hover:not(:disabled) {
  transform: translateY(-2px);
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Added error message styling */
.error-message {
  margin-top: 15px;
  padding: 10px;
  background-color: #fee;
  color: #c33;
  border-radius: 5px;
  font-size: 14px;
  text-align: center;
}
</style>
