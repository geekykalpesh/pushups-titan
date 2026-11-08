const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { generateToken } = require('../config/jwt');

// Register user
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Check existing
    const existing = await query(
      'SELECT id, username, email FROM users WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($2)',
      [email.trim(), username.trim()]
    );

    if (existing.rows.length > 0) {
      const match = existing.rows[0];
      if (match.email.toLowerCase() === email.trim().toLowerCase()) {
        return res.status(409).json({ success: false, message: 'Email already registered' });
      }
      return res.status(409).json({ success: false, message: 'Username already taken' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, daily_pushup_goal, daily_egg_goal, daily_protein_goal, created_at`,
      [username.trim(), email.trim().toLowerCase(), passwordHash]
    );

    const user = newUser.rows[0];
    const token = generateToken({ id: user.id, email: user.email, username: user.username });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to your pushup journey!',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        daily_pushup_goal: user.daily_pushup_goal,
        daily_egg_goal: user.daily_egg_goal,
        daily_protein_goal: user.daily_protein_goal,
        has_pin: false,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const result = await query(
      'SELECT id, username, email, password_hash, pin_hash, daily_pushup_goal, daily_egg_goal, daily_protein_goal FROM users WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken({ id: user.id, email: user.email, username: user.username });

    return res.json({
      success: true,
      message: `Welcome back, ${user.username}!`,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        daily_pushup_goal: user.daily_pushup_goal,
        daily_egg_goal: user.daily_egg_goal,
        daily_protein_goal: user.daily_protein_goal,
        has_pin: !!user.pin_hash,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// Set or update 4-digit Passcode PIN
const setPin = async (req, res) => {
  try {
    const userId = req.user.id;
    const { pin } = req.body;

    if (!pin || !/^\d{4}$/.test(pin.toString())) {
      return res.status(400).json({
        success: false,
        message: 'PIN must be exactly 4 numeric digits',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const pinHash = await bcrypt.hash(pin.toString(), salt);

    await query('UPDATE users SET pin_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
      pinHash,
      userId,
    ]);

    return res.json({
      success: true,
      message: '4-digit Passcode saved successfully! You can now quick-unlock anytime.',
    });
  } catch (error) {
    console.error('Set PIN error:', error);
    return res.status(500).json({ success: false, message: 'Error setting PIN' });
  }
};

// PIN Login / Quick unlock
const pinLogin = async (req, res) => {
  try {
    const { email, pin } = req.body;

    if (!email || !pin) {
      return res.status(400).json({
        success: false,
        message: 'Email and 4-digit PIN are required',
      });
    }

    const result = await query(
      'SELECT id, username, email, pin_hash, daily_pushup_goal, daily_egg_goal, daily_protein_goal FROM users WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = result.rows[0];
    if (!user.pin_hash) {
      return res.status(400).json({
        success: false,
        message: 'No 4-digit passcode set for this user yet. Please log in with password first.',
      });
    }

    const isMatch = await bcrypt.compare(pin.toString(), user.pin_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect 4-digit passcode' });
    }

    const token = generateToken({ id: user.id, email: user.email, username: user.username });

    return res.json({
      success: true,
      message: 'Quick passcode unlock successful!',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        daily_pushup_goal: user.daily_pushup_goal,
        daily_egg_goal: user.daily_egg_goal,
        daily_protein_goal: user.daily_protein_goal,
        has_pin: true,
      },
    });
  } catch (error) {
    console.error('PIN Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during PIN login' });
  }
};

// Get current profile
const getProfile = async (req, res) => {
  try {
    return res.json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error getting profile' });
  }
};

// Update daily goals
const updateGoals = async (req, res) => {
  try {
    const userId = req.user.id;
    const { daily_pushup_goal, daily_egg_goal, daily_protein_goal } = req.body;

    const result = await query(
      `UPDATE users
       SET daily_pushup_goal = COALESCE($1, daily_pushup_goal),
           daily_egg_goal = COALESCE($2, daily_egg_goal),
           daily_protein_goal = COALESCE($3, daily_protein_goal),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, username, email, daily_pushup_goal, daily_egg_goal, daily_protein_goal`,
      [daily_pushup_goal, daily_egg_goal, daily_protein_goal, userId]
    );

    return res.json({
      success: true,
      message: 'Daily targets updated!',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Update goals error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating goals' });
  }
};

module.exports = {
  register,
  login,
  setPin,
  pinLogin,
  getProfile,
  updateGoals,
};
