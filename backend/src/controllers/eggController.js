const { query } = require('../config/db');

const PROTEIN_PER_EGG = 6.3; // grams of high quality protein per egg

// Log eggs eaten
const logEggs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { count, notes, log_date } = req.body;

    const eggCount = parseInt(count, 10);
    if (isNaN(eggCount) || eggCount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Egg count must be a positive number',
      });
    }

    const proteinGrams = parseFloat((eggCount * PROTEIN_PER_EGG).toFixed(1));
    const dateToUse = log_date || new Date().toISOString().split('T')[0];

    const result = await query(
      `INSERT INTO egg_logs (user_id, count, protein_grams, logged_at, log_date, notes)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $5)
       RETURNING id, count, protein_grams, logged_at, log_date, notes`,
      [userId, eggCount, proteinGrams, dateToUse, notes || '']
    );

    // Calculate today's aggregate
    const dayStats = await query(
      `SELECT COALESCE(SUM(count), 0) AS total_eggs, COALESCE(SUM(protein_grams), 0) AS total_protein
       FROM egg_logs
       WHERE user_id = $1 AND log_date = $2`,
      [userId, dateToUse]
    );

    const totalEggs = parseInt(dayStats.rows[0].total_eggs, 10);
    const totalProtein = parseFloat(dayStats.rows[0].total_protein).toFixed(1);

    // Fetch user goals
    const userRes = await query(
      'SELECT daily_egg_goal, daily_protein_goal FROM users WHERE id = $1',
      [userId]
    );
    const eggGoal = userRes.rows[0]?.daily_egg_goal || 4;
    const proteinGoal = parseFloat(userRes.rows[0]?.daily_protein_goal || 30.0);

    return res.status(201).json({
      success: true,
      message: `Added ${eggCount} eggs (+${proteinGrams}g protein)! 🥚`,
      log: result.rows[0],
      todaySummary: {
        date: dateToUse,
        total_eggs: totalEggs,
        total_protein: totalProtein,
        egg_goal: eggGoal,
        protein_goal: proteinGoal,
        egg_percentage: Math.min(100, Math.round((totalEggs / eggGoal) * 100)),
        protein_percentage: Math.min(100, Math.round((parseFloat(totalProtein) / proteinGoal) * 100)),
      },
      celebration: {
        quote: `🍳 Fueling the machine! +${proteinGrams}g protein locked in for muscle recovery.`,
        eggCount,
        proteinGrams,
      },
    });
  } catch (error) {
    console.error('Log eggs error:', error);
    return res.status(500).json({ success: false, message: 'Server error logging eggs' });
  }
};

// Get eggs & protein by date
const getEggsByDate = async (req, res) => {
  try {
    const userId = req.user.id;
    const requestedDate = req.query.date || new Date().toISOString().split('T')[0];

    const logs = await query(
      `SELECT id, count, protein_grams, logged_at, log_date, notes
       FROM egg_logs
       WHERE user_id = $1 AND log_date = $2
       ORDER BY logged_at DESC`,
      [userId, requestedDate]
    );

    const userRes = await query(
      'SELECT daily_egg_goal, daily_protein_goal FROM users WHERE id = $1',
      [userId]
    );
    const eggGoal = userRes.rows[0]?.daily_egg_goal || 4;
    const proteinGoal = parseFloat(userRes.rows[0]?.daily_protein_goal || 30.0);

    const totalEggs = logs.rows.reduce((sum, item) => sum + parseInt(item.count, 10), 0);
    const totalProtein = logs.rows.reduce((sum, item) => sum + parseFloat(item.protein_grams), 0).toFixed(1);

    return res.json({
      success: true,
      date: requestedDate,
      total_eggs: totalEggs,
      total_protein: parseFloat(totalProtein),
      egg_goal: eggGoal,
      protein_goal: proteinGoal,
      egg_percentage: Math.min(100, Math.round((totalEggs / eggGoal) * 100)),
      protein_percentage: Math.min(100, Math.round((parseFloat(totalProtein) / proteinGoal) * 100)),
      logs: logs.rows,
    });
  } catch (error) {
    console.error('Get eggs by date error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving egg logs' });
  }
};

// Get monthly egg & protein stats for graphs
const getMonthlyEggStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const year = parseInt(req.query.year || now.getFullYear(), 10);
    const month = parseInt(req.query.month || now.getMonth() + 1, 10);

    const result = await query(
      `SELECT 
         log_date,
         TO_CHAR(log_date, 'YYYY-MM-DD') as formatted_date,
         EXTRACT(DAY FROM log_date) as day_of_month,
         SUM(count) as total_eggs,
         SUM(protein_grams) as total_protein
       FROM egg_logs
       WHERE user_id = $1
         AND EXTRACT(YEAR FROM log_date) = $2
         AND EXTRACT(MONTH FROM log_date) = $3
       GROUP BY log_date
       ORDER BY log_date ASC`,
      [userId, year, month]
    );

    let grandTotalEggs = 0;
    let grandTotalProtein = 0;
    const daysInMonth = new Date(year, month, 0).getDate();

    const dailyMap = {};
    result.rows.forEach((row) => {
      const d = parseInt(row.day_of_month, 10);
      const e = parseInt(row.total_eggs, 10);
      const p = parseFloat(row.total_protein);
      dailyMap[d] = { eggs: e, protein: p };
      grandTotalEggs += e;
      grandTotalProtein += p;
    });

    const chartData = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const item = dailyMap[day] || { eggs: 0, protein: 0 };
      chartData.push({
        day,
        label: `${day}`,
        eggs: item.eggs,
        protein: parseFloat(item.protein.toFixed(1)),
      });
    }

    return res.json({
      success: true,
      year,
      month,
      grandTotalEggs,
      grandTotalProtein: parseFloat(grandTotalProtein.toFixed(1)),
      averageEggsPerDay: parseFloat((grandTotalEggs / daysInMonth).toFixed(1)),
      averageProteinPerDay: parseFloat((grandTotalProtein / daysInMonth).toFixed(1)),
      chartData,
    });
  } catch (error) {
    console.error('Monthly egg stats error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving monthly egg stats' });
  }
};

// Delete egg log
const deleteEggLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await query(
      'DELETE FROM egg_logs WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Log entry not found' });
    }

    return res.json({ success: true, message: 'Egg log removed' });
  } catch (error) {
    console.error('Delete egg error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting egg log' });
  }
};

// Get egg contributions rolling history (for GitHub-style graph)
const getEggContributions = async (req, res) => {
  try {
    const userId = req.user.id;
    const days = parseInt(req.query.days || 150, 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startStr = startDate.toISOString().split('T')[0];

    const result = await query(
      `SELECT 
         TO_CHAR(log_date, 'YYYY-MM-DD') as date,
         SUM(count) as eggs,
         SUM(protein_grams) as protein,
         COUNT(id) as logs_count
       FROM egg_logs
       WHERE user_id = $1 AND log_date >= $2
       GROUP BY log_date
       ORDER BY log_date ASC`,
      [userId, startStr]
    );

    const map = {};
    let totalEggs = 0;
    let totalProtein = 0;
    result.rows.forEach((r) => {
      const e = parseInt(r.eggs, 10);
      const p = parseFloat(r.protein || 0);
      map[r.date] = { eggs: e, protein: p };
      totalEggs += e;
      totalProtein += p;
    });

    return res.json({
      success: true,
      days,
      startDate: startStr,
      totalEggs,
      totalProtein: parseFloat(totalProtein.toFixed(1)),
      activeDays: result.rows.length,
      contributions: map,
      raw: result.rows,
    });
  } catch (error) {
    console.error('Egg contributions error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving egg contributions' });
  }
};

module.exports = {
  logEggs,
  getEggsByDate,
  getMonthlyEggStats,
  deleteEggLog,
  getEggContributions,
};
