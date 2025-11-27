import ThongBaoService from '../services/thongBaoService.js';

/**
 * Get all unread notifications.
 */
export const getAllThongBaos = async (req, res) => {
  try {
    const thongBaos = await ThongBaoService.getRecentThongBaos();
    res.status(200).json(thongBaos);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
};

/**
 * Mark a notification as read.
 */
export const markThongBaoAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ThongBaoService.markAsRead(id);
    if (result[0] === 0) {
      return res.status(404).json({ message: 'Notification not found or already marked as read.' });
    }
    res.status(200).json({ message: 'Notification marked as read successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating notification', error: error.message });
  }
};
