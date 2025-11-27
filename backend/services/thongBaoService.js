import db from '../models/index.js';

class ThongBaoService {
  /**
   * Creates a new notification.
   * @param {number} maPhienChat - The ID of the chat session.
   * @param {string} noiDung - The content of the notification.
   * @returns {Promise<object>} The created notification object.
   */
  static async createThongBao(maPhienChat, noiDung) {
    try {
      const thongBao = await db.ThongBao.create({
        MaPhienChat: maPhienChat,
        NoiDung: noiDung,
        TrangThai: 'ChuaDoc',
      });
      return thongBao;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  /**
   * Fetches recent notifications.
   * @returns {Promise<Array<object>>} A list of notifications.
   */
  static async getRecentThongBaos() {
    try {
      const thongBaos = await db.ThongBao.findAll({
        limit: 50, // Giới hạn để không tải quá nhiều
        order: [['ThoiGianTao', 'DESC']],
        include: [{
          model: db.PhienChat,
          attributes: ['MaPhienChat', 'MaKH'],
          include: [{
            model: db.KhachHang,
            attributes: ['HoTen']
          }]
        }]
      });
      return thongBaos;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  }

  /**
   * Marks a specific notification as read.
   * @param {number} maThongBao - The ID of the notification.
   * @returns {Promise<[number, object[]]>} The result of the update operation.
   */
  static async markAsRead(maThongBao) {
    try {
      const result = await db.ThongBao.update(
        { TrangThai: 'DaDoc' },
        { where: { MaThongBao: maThongBao } }
      );
      return result;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }
}

export default ThongBaoService;
