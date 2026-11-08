const { query } = require('../config/db');

// Get all reminders for user
const getReminders = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(
      `SELECT id, title, TO_CHAR(reminder_time, 'HH24:MI') as reminder_time, is_active, target_count, days_of_week, created_at
       FROM reminders
       WHERE user_id = $1
       ORDER BY reminder_time ASC`,
      [userId]
    );

    return res.json({
      success: true,
      reminders: result.rows,
    });
  } catch (error) {
    console.error('Get reminders error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving reminders' });
  }
};

// Create a new reminder / alarm
const createReminder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, reminder_time, target_count, days_of_week } = req.body;

    if (!reminder_time) {
      return res.status(400).json({
        success: false,
        message: 'Reminder time is required (e.g., "14:30")',
      });
    }

    const result = await query(
      `INSERT INTO reminders (user_id, title, reminder_time, target_count, days_of_week)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, TO_CHAR(reminder_time, 'HH24:MI') as reminder_time, is_active, target_count, days_of_week`,
      [
        userId,
        title || 'Pushup Power Alert',
        reminder_time,
        target_count ? parseInt(target_count, 10) : 20,
        days_of_week || '1,2,3,4,5,6,7',
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Pushup alarm reminder set!',
      reminder: result.rows[0],
    });
  } catch (error) {
    console.error('Create reminder error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating reminder' });
  }
};

// Toggle or update reminder
const updateReminder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, reminder_time, is_active, target_count, days_of_week } = req.body;

    const result = await query(
      `UPDATE reminders
       SET title = COALESCE($1, title),
           reminder_time = COALESCE($2, reminder_time),
           is_active = COALESCE($3, is_active),
           target_count = COALESCE($4, target_count),
           days_of_week = COALESCE($5, days_of_week)
       WHERE id = $6 AND user_id = $7
       RETURNING id, title, TO_CHAR(reminder_time, 'HH24:MI') as reminder_time, is_active, target_count, days_of_week`,
      [title, reminder_time, is_active, target_count, days_of_week, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }

    return res.json({
      success: true,
      message: 'Reminder updated',
      reminder: result.rows[0],
    });
  } catch (error) {
    console.error('Update reminder error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating reminder' });
  }
};

// Delete reminder
const deleteReminder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await query(
      'DELETE FROM reminders WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }

    return res.json({ success: true, message: 'Reminder deleted' });
  } catch (error) {
    console.error('Delete reminder error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting reminder' });
  }
};

module.exports = {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
};
