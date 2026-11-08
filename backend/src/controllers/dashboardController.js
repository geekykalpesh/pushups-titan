const { query } = require('../config/db');

// Calculate consecutive active streak days
const calculateStreak = async (userId) => {
  const result = await query(
    `SELECT DISTINCT log_date
     FROM pushup_logs
     WHERE user_id = $1
     ORDER BY log_date DESC`,
    [userId]
  );

  if (result.rows.length === 0) return 0;

  const dates = result.rows.map((r) => new Date(r.log_date).toISOString().split('T')[0]);
  const today = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  // If user hasn't logged today or yesterday, streak is broken
  if (dates[0] !== today && dates[0] !== yesterday) {
    return 0;
  }

  let streak = 0;
  let checkDate = new Date(dates[0]);

  for (let i = 0; i < dates.length; i++) {
    const currentStr = new Date(dates[i]).toISOString().split('T')[0];
    const expectedStr = checkDate.toISOString().split('T')[0];

    if (currentStr === expectedStr) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

// Determine psychology level
const getPsychologyRank = (allTimePushups) => {
  if (allTimePushups >= 5000) return { rank: 'Immortal Spartan God', tier: 5, badge: '🔱', nextGoal: null };
  if (allTimePushups >= 2000) return { rank: 'Titan of Discipline', tier: 4, badge: '⚡', nextGoal: 5000 };
  if (allTimePushups >= 750) return { rank: 'Centurion Beast', tier: 3, badge: '🦁', nextGoal: 2000 };
  if (allTimePushups >= 200) return { rank: 'Iron Chest Warrior', tier: 2, badge: '🛡️', nextGoal: 750 };
  return { rank: 'Rising Gladiator', tier: 1, badge: '⚔️', nextGoal: 200 };
};

// Combined dashboard overview
const getDashboardOverview = async (req, res) => {
  try {
    const userId = req.user.id;
    const requestedDate = req.query.date || new Date().toISOString().split('T')[0];

    // Today's pushups
    const pushupRes = await query(
      `SELECT COALESCE(SUM(count), 0) AS total_pushups, COUNT(id) AS sets_count
       FROM pushup_logs
       WHERE user_id = $1 AND log_date = $2`,
      [userId, requestedDate]
    );

    // Today's eggs & protein
    const eggRes = await query(
      `SELECT COALESCE(SUM(count), 0) AS total_eggs, COALESCE(SUM(protein_grams), 0) AS total_protein
       FROM egg_logs
       WHERE user_id = $1 AND log_date = $2`,
      [userId, requestedDate]
    );

    // All time totals
    const allTimeRes = await query(
      `SELECT COALESCE(SUM(count), 0) AS all_time_pushups, COUNT(id) AS all_time_sets
       FROM pushup_logs
       WHERE user_id = $1`,
      [userId]
    );

    // User goals
    const userRes = await query(
      'SELECT daily_pushup_goal, daily_egg_goal, daily_protein_goal FROM users WHERE id = $1',
      [userId]
    );

    // Active reminders
    const remindersRes = await query(
      `SELECT id, title, TO_CHAR(reminder_time, 'HH24:MI') as reminder_time, target_count
       FROM reminders
       WHERE user_id = $1 AND is_active = TRUE
       ORDER BY reminder_time ASC`,
      [userId]
    );

    const user = userRes.rows[0] || {};
    const totalPushups = parseInt(pushupRes.rows[0].total_pushups, 10);
    const pushupGoal = user.daily_pushup_goal || 100;
    const setsCount = parseInt(pushupRes.rows[0].sets_count, 10);

    const totalEggs = parseInt(eggRes.rows[0].total_eggs, 10);
    const eggGoal = user.daily_egg_goal || 4;
    const totalProtein = parseFloat(eggRes.rows[0].total_protein).toFixed(1);
    const proteinGoal = parseFloat(user.daily_protein_goal || 30.0);

    const allTimePushups = parseInt(allTimeRes.rows[0].all_time_pushups, 10);
    const streakDays = await calculateStreak(userId);
    const psychologyRank = getPsychologyRank(allTimePushups);

    // Recent 5 pushup sets
    const recentSets = await query(
      `SELECT id, count, logged_at, TO_CHAR(logged_at, 'HH12:MI AM') as formatted_time, notes
       FROM pushup_logs
       WHERE user_id = $1 AND log_date = $2
       ORDER BY logged_at DESC
       LIMIT 10`,
      [userId, requestedDate]
    );

    return res.json({
      success: true,
      date: requestedDate,
      streakDays,
      rank: psychologyRank,
      pushups: {
        today: totalPushups,
        goal: pushupGoal,
        setsCount,
        percentage: Math.min(100, Math.round((totalPushups / pushupGoal) * 100)),
        completed: totalPushups >= pushupGoal,
        recentSets: recentSets.rows,
      },
      nutrition: {
        eggsToday: totalEggs,
        eggGoal,
        proteinToday: parseFloat(totalProtein),
        proteinGoal,
        eggPercentage: Math.min(100, Math.round((totalEggs / eggGoal) * 100)),
        proteinPercentage: Math.min(100, Math.round((parseFloat(totalProtein) / proteinGoal) * 100)),
      },
      allTime: {
        totalPushups: allTimePushups,
        totalSets: parseInt(allTimeRes.rows[0].all_time_sets, 10),
      },
      reminders: remindersRes.rows,
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving dashboard' });
  }
};

module.exports = {
  getDashboardOverview,
};
