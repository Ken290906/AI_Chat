import db from "../models/index.js";

export class NotificationService {
  /**
   * Tạo một bản ghi thông báo (ThongBao) mới trong cơ sở dữ liệu.
   * @param {string} noiDung - Nội dung của thông báo.
   * @param {string} maPhienChat - Mã phiên chat liên quan.
   * @param {string} [trangThai='ChuaDoc'] - Trạng thái của thông báo ('ChuaDoc' hoặc 'DaDoc').
   * @returns {Promise<object>} Bản ghi ThongBao vừa được tạo.
   */
  static async createNotification(noiDung, maPhienChat, trangThai = 'ChuaDoc') {
    try {
      console.log(`🔹 Creating new notification for chat ${maPhienChat}: ${noiDung}`);

      const thongBao = await db.ThongBao.create({
        NoiDung: noiDung,
        MaPhienChat: maPhienChat,
        ThoiGianTao: new Date(),
        TrangThai: trangThai,
      });

      // Fetch lại bản ghi để có đầy đủ các include cần thiết cho frontend (ví dụ: PhienChat)
      const fullThongBao = await db.ThongBao.findByPk(thongBao.MaThongBao, {
        include: [{
          model: db.PhienChat,
          attributes: ['MaPhienChat', 'MaKH'],
          include: [{
            model: db.KhachHang,
            attributes: ['HoTen']
          }]
        }]
      });

      console.log(`✅ Notification created: ${fullThongBao.MaThongBao}`);
      return fullThongBao;

    } catch (error) {
      console.error("❌ Lỗi khi tạo Thông Báo:", error);
      throw error;
    }
  }

  /**
   * Cập nhật trạng thái của một thông báo.
   * @param {number} maThongBao - Mã của thông báo cần cập nhật.
   * @param {string} trangThai - Trạng thái mới ('ChuaDoc' hoặc 'DaDoc').
   * @returns {Promise<object>} Bản ghi ThongBao đã được cập nhật.
   */
  static async updateNotificationStatus(maThongBao, trangThai) {
    try {
      const thongBao = await db.ThongBao.findByPk(maThongBao);
      if (thongBao) {
        thongBao.TrangThai = trangThai;
        await thongBao.save();
        return thongBao;
      }
      return null;
    } catch (error) {
      console.error("❌ Lỗi khi cập nhật trạng thái Thông Báo:", error);
      throw error;
    }
  }
}

export default NotificationService;
