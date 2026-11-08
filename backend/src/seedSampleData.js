const { query } = require('./config/db');

async function seed() {
  try {
    const userRes = await query("SELECT id FROM users WHERE email = 'geekykalpesh@gmail.com'");
    if (!userRes.rows.length) {
      console.log('User not found');
      process.exit(1);
    }
    const uid = userRes.rows[0].id;
    const sample = [
      { day: 1, reps: 40, eggs: 3 },
      { day: 2, reps: 65, eggs: 4 },
      { day: 3, reps: 80, eggs: 4 },
      { day: 4, reps: 50, eggs: 2 },
      { day: 5, reps: 110, eggs: 5 },
      { day: 6, reps: 90, eggs: 4 },
      { day: 7, reps: 130, eggs: 6 },
      { day: 8, reps: 100, eggs: 5 },
    ];
    for (const s of sample) {
      const dStr = '2026-11-' + String(s.day).padStart(2, '0');
      await query(
        'INSERT INTO pushup_logs (user_id, count, log_date, notes) VALUES ($1, $2, $3, $4)',
        [uid, s.reps, dStr, 'Set on day ' + s.day]
      );
      await query(
        'INSERT INTO egg_logs (user_id, count, protein_grams, log_date, notes) VALUES ($1, $2, $3, $4, $5)',
        [uid, s.eggs, Math.round(s.eggs * 6.3 * 10) / 10, dStr, 'Eggs on day ' + s.day]
      );
    }
    console.log('Seeded sample data for geekykalpesh successfully!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
