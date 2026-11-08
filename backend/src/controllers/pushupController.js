const { query } = require('../config/db');

// Motivational quotes bank based on sport psychology & discipline
const MOTIVATIONAL_PUNCHLINES = [
  "🔥 Incredible effort! Every pushup builds the iron armor of your mind.",
  "⚡ Boom! You didn't negotiate with weakness today.",
  "💪 Beast mode in effect! Your future self is saluting you.",
  "🏆 Champions do what they must, even when they don't feel like it.",
  "🚀 Another set conquered! Consistency is the true superpower.",
  "⚔️ Relentless! You are unstoppable today.",
  "🦁 The pain you feel today will be the strength you feel tomorrow.",
  "💥 That's how it's done! Discipline beats motivation every single time.",
];

// Log a pushup set
const logPushups = async (req, res) => {
  try {
    const userId = req.user.id;
    const { count, notes, log_date } = req.body;

    const pushupCount = parseInt(count, 10);
    if (isNaN(pushupCount) || pushupCount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Pushup count must be a positive number',
      });
    }

    const dateToUse = log_date || new Date().toISOString().split('T')[0];

    // Insert pushup log
    const result = await query(
      `INSERT INTO pushup_logs (user_id, count, logged_at, log_date, notes)
       VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4)
       RETURNING id, count, logged_at, log_date, notes`,
      [userId, pushupCount, dateToUse, notes || '']
    );

    const newLog = result.rows[0];

    // Calculate today's aggregate
    const dayStats = await query(
      `SELECT COALESCE(SUM(count), 0) AS total_today, COUNT(id) AS sets_count
       FROM pushup_logs
       WHERE user_id = $1 AND log_date = $2`,
      [userId, dateToUse]
    );

    const totalToday = parseInt(dayStats.rows[0].total_today, 10);
    const setsCount = parseInt(dayStats.rows[0].sets_count, 10);

    // Fetch user goal
    const userRes = await query('SELECT daily_pushup_goal FROM users WHERE id = $1', [userId]);
    const goal = userRes.rows[0]?.daily_pushup_goal || 100;
    const goalCompleted = totalToday >= goal;

    // Pick random motivational quote
    const randomQuote = MOTIVATIONAL_PUNCHLINES[Math.floor(Math.random() * MOTIVATIONAL_PUNCHLINES.length)];

    return res.status(201).json({
      success: true,
      message: `Added ${pushupCount} pushups!`,
      log: newLog,
      todaySummary: {
        date: dateToUse,
        total_today: totalToday,
        sets_count: setsCount,
        goal,
        percentage: Math.min(100, Math.round((totalToday / goal) * 100)),
        goal_completed: goalCompleted,
      },
      celebration: {
        trigger: true,
        type: goalCompleted ? 'GOAL_EXPLOSION' : pushupCount >= 30 ? 'MEGA_BURST' : 'SPARKLE_BURST',
        quote: randomQuote,
        addedCount: pushupCount,
        totalToday,
      },
    });
  } catch (error) {
    console.error('Log pushup error:', error);
    return res.status(500).json({ success: false, message: 'Server error logging pushups' });
  }
};

// Get pushups for a specific date (defaults to today)
const getPushupsByDate = async (req, res) => {
  try {
    const userId = req.user.id;
    const requestedDate = req.query.date || new Date().toISOString().split('T')[0];

    // Get individual sets
    const sets = await query(
      `SELECT id, count, logged_at, log_date, notes
       FROM pushup_logs
       WHERE user_id = $1 AND log_date = $2
       ORDER BY logged_at DESC`,
      [userId, requestedDate]
    );

    // Get user goal
    const userRes = await query('SELECT daily_pushup_goal FROM users WHERE id = $1', [userId]);
    const goal = userRes.rows[0]?.daily_pushup_goal || 100;

    const total = sets.rows.reduce((sum, item) => sum + parseInt(item.count, 10), 0);

    return res.json({
      success: true,
      date: requestedDate,
      total,
      goal,
      percentage: Math.min(100, Math.round((total / goal) * 100)),
      sets: sets.rows,
    });
  } catch (error) {
    console.error('Get pushups by date error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving pushup logs' });
  }
};

// Get monthly graph data and progression
const getMonthlyStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const year = parseInt(req.query.year || now.getFullYear(), 10);
    const month = parseInt(req.query.month || now.getMonth() + 1, 10); // 1-12

    // Get daily aggregated pushup totals for this month
    const result = await query(
      `SELECT 
         log_date,
         TO_CHAR(log_date, 'YYYY-MM-DD') as formatted_date,
         EXTRACT(DAY FROM log_date) as day_of_month,
         SUM(count) as total_pushups,
         COUNT(id) as total_sets
       FROM pushup_logs
       WHERE user_id = $1 
         AND EXTRACT(YEAR FROM log_date) = $2
         AND EXTRACT(MONTH FROM log_date) = $3
       GROUP BY log_date
       ORDER BY log_date ASC`,
      [userId, year, month]
    );

    // Compute month totals & records
    let grandTotal = 0;
    let highestDay = { date: null, count: 0 };
    const daysInMonth = new Date(year, month, 0).getDate();

    // Map into complete days array for chart
    const dailyMap = {};
    result.rows.forEach((row) => {
      const d = parseInt(row.day_of_month, 10);
      const c = parseInt(row.total_pushups, 10);
      dailyMap[d] = c;
      grandTotal += c;
      if (c > highestDay.count) {
        highestDay = { date: row.formatted_date, count: c };
      }
    });

    const chartData = [];
    for (let day = 1; day <= daysInMonth; day++) {
      chartData.push({
        day,
        label: `${day}`,
        pushups: dailyMap[day] || 0,
      });
    }

    return res.json({
      success: true,
      year,
      month,
      grandTotal,
      averagePerDay: Math.round(grandTotal / daysInMonth),
      activeDays: result.rows.length,
      highestDay,
      chartData,
      rawLogs: result.rows,
    });
  } catch (error) {
    console.error('Monthly stats error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving monthly stats' });
  }
};

// Delete a single pushup log
const deletePushup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await query(
      'DELETE FROM pushup_logs WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Log entry not found' });
    }

    return res.json({ success: true, message: 'Log removed successfully' });
  } catch (error) {
    console.error('Delete pushup error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting pushup log' });
  }
};

// Get contributions rolling history (exact for GitHub-style graph)
const getContributions = async (req, res) => {
  try {
    const userId = req.user.id;
    const days = parseInt(req.query.days || 150, 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startStr = startDate.toISOString().split('T')[0];

    const result = await query(
      `SELECT 
         TO_CHAR(log_date, 'YYYY-MM-DD') as date,
         SUM(count) as count,
         COUNT(id) as sets
       FROM pushup_logs
       WHERE user_id = $1 AND log_date >= $2
       GROUP BY log_date
       ORDER BY log_date ASC`,
      [userId, startStr]
    );

    const map = {};
    let total = 0;
    result.rows.forEach((r) => {
      const c = parseInt(r.count, 10);
      map[r.date] = c;
      total += c;
    });

    return res.json({
      success: true,
      days,
      startDate: startStr,
      total,
      activeDays: result.rows.length,
      contributions: map,
      raw: result.rows,
    });
  } catch (error) {
    console.error('Contributions error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving contributions' });
  }
};

module.exports = {
  logPushups,
  getPushupsByDate,
  getMonthlyStats,
  deletePushup,
  getContributions,
};
