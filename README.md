# Hệ thống Chat Hỗ trợ Khách hàng sử dụng AI

## 1. Giới thiệu

Đây là một dự án xây dựng hệ thống chat hỗ trợ khách hàng thời gian thực. Hệ thống cho phép khách hàng trò chuyện với nhân viên hỗ trợ thông qua một giao diện web. Điểm nổi bật của dự án là việc tích hợp các yếu_tố AI (dự kiến) như tóm tắt phiên chat, phân tích cảm xúc, và một bảng điều khiển (dashboard) dành cho quản trị viên để theo dõi hoạt động.

Hệ thống bao gồm các tính năng chính:
- **Chat thời gian thực:** Giao tiếp hai chiều giữa khách hàng và nhân viên hỗ trợ sử dụng WebSocket.
- **Bảng điều khiển (Dashboard):** Cung cấp cái nhìn tổng quan về các chỉ số quan trọng như tổng số phiên chat, tin nhắn, và các cảnh báo hệ thống.
- **Hệ thống thông báo:** Thông báo cho nhân viên hỗ trợ khi có tin nhắn mới hoặc yêu cầu hỗ trợ khẩn cấp từ khách hàng.
- **Quản lý trạng thái tập trung:** Sử dụng Pinia để quản lý trạng thái ứng dụng phía frontend, giúp dữ liệu luôn đồng bộ và nhất quán trên các thành phần khác nhau.

## 2. Các công nghệ sử dụng

- **Backend:**
  - **Node.js:** Nền tảng chạy phía máy chủ.
  - **Express.js:** Framework web để xây dựng các API.
  - **Sequelize:** ORM (Object-Relational Mapping) để tương tác với cơ sở dữ liệu MySQL.
  - **WebSocket (`ws`):** Cho phép giao tiếp hai chiều, thời gian thực.
- **Frontend:**
  - **Vue.js:** Framework JavaScript để xây dựng giao diện người dùng.
  - **Pinia:** Thư viện quản lý trạng thái toàn cục cho Vue.js.
  - **Vue Router:** Xử lý việc định tuyến phía client.
  - **Bootstrap & Bootstrap Icons:** Framework CSS để tạo giao diện nhanh chóng và đẹp mắt.
  - **Axios:** Thư viện để thực hiện các yêu cầu HTTP đến backend.

## 3. Mô tả chi tiết các tệp chính

### Backend (`/backend`)

Phần backend được xây dựng theo kiến trúc gần giống MVC (Model-View-Controller) để phân tách rõ ràng các chức năng.

| `server.js`             | **Điểm khởi đầu của server.** Tệp này khởi tạo Express, kết nối cơ sở dữ liệu qua Sequelize, thiết lập WebSocket, và liên kết tất cả các routes (đường dẫn API).      |
| `websocket/websocket.js`| **Trái tim của hệ thống chat.** Quản lý tất cả các kết nối WebSocket, xử lý việc đăng ký của admin và client, nhận và gửi tin nhắn, và kích hoạt các logic nghiệp vụ như tạo thông báo khi có tin nhắn mới. |
| `routes/`               | Thư mục chứa các tệp định nghĩa đường dẫn API. Ví dụ, `thongbao.js` định nghĩa các endpoint như `GET /api/thongbao` để lấy danh sách thông báo.                 |
| `controllers/`          | Chứa logic xử lý cho từng yêu cầu API. Ví dụ, `thongBaoController.js` nhận yêu cầu, gọi đến `service` để xử lý nghiệp vụ, và trả về phản hồi cho client.      |
| `services/`             | Chứa logic nghiệp vụ chính và các tương tác với cơ sở dữ liệu. Ví dụ, `thongBaoService.js` có các hàm như `createThongBao` để tạo thông báo mới trong DB. |
| `models/`               | Định nghĩa cấu trúc của các bảng trong cơ sở dữ liệu dưới dạng các đối tượng Sequelize. Ví dụ, `thongbao.js` định nghĩa model cho bảng `thongbao`.             |
| `models/index.js`       | Tệp trung tâm, nơi tất cả các model được khởi tạo và các mối quan hệ (associations) giữa chúng được thiết lập.                                                    |

### Frontend (`/my-app`)

Frontend được xây dựng bằng Vue.js 3, sử dụng Composition API và quản lý trạng thái bằng Pinia.

| `src/main.js`               | **Điểm khởi đầu của ứng dụng Vue.** Tệp này khởi tạo Vue, Vue Router, và quan trọng nhất là Pinia, để cung cấp store quản lý trạng thái cho toàn bộ ứng dụng.                                                                  |
| `src/stores/mainStore.js`   | **Bộ não của ứng dụng frontend.** Đây là một Pinia store, nơi quản lý trạng thái toàn cục, bao gồm kết nối WebSocket, danh sách thông báo, danh sách client, và thông tin nhân viên. Toàn bộ logic bất đồng bộ và giao tiếp với server được tập trung tại đây, giúp các component chỉ có nhiệm vụ hiển thị dữ liệu. |
| `src/router/index.js`       | Định nghĩa các trang (routes) của ứng dụng, ví dụ: `/login` cho trang đăng nhập và `/` cho layout chính của admin.                                                                                                             |
| `src/views/AdminLayout.vue` | **Component layout chính.** Bố cục bao quanh hầu hết các trang của admin, chứa `Header`, `Sidebar`, và `<router-view>`. Nó kết nối với `mainStore` để lấy dữ liệu và gọi các hành động, đảm bảo trạng thái được duy trì khi điều hướng giữa các trang con. |
| `src/components/Header.vue` | Component hiển thị thanh điều hướng trên cùng, bao gồm tên nhân viên và **nút chuông thông báo**. Nó nhận dữ liệu thông báo từ `AdminLayout` và phát ra các sự kiện khi người dùng tương tác (ví dụ: nhấn vào một thông báo). |
| `src/components/ChatPanel.vue`| (Giả định) Component chính cho giao diện chat, nơi hiển thị các tin nhắn và cho phép nhân viên gửi tin nhắn trả lời.                                                                                                         |
| `src/App.vue`               | Component gốc của toàn bộ ứng dụng, thường chỉ chứa `<router-view>` để hiển thị các component tương ứng với đường dẫn hiện tại.                                                                                             |

## 4. Hướng dẫn cài đặt và chạy

### Yêu cầu
- Node.js (phiên bản 16.x trở lên)
- MySQL

### Cài đặt Backend
1.  Di chuyển vào thư mục `backend`: `cd backend`
2.  Cài đặt các gói phụ thuộc: `npm install`
3.  Cấu hình file `.env` với thông tin kết nối cơ sở dữ liệu của bạn.
4.  Chạy server: `npm start` hoặc `node server.js`

### Cài đặt Frontend
1.  Di chuyển vào thư mục `my-app`: `cd my-app`np
2.  Cài đặt các gói phụ thuộc: `npm install`
3.  Chạy server phát triển: `npm run dev`
4.  Mở trình duyệt và truy cập vào địa chỉ `http://localhost:5173` (hoặc cổng được chỉ định).