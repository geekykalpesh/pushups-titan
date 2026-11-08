const express = require('express');
const router = express.Router();
const {
  register,
  login,
  setPin,
  pinLogin,
  getProfile,
  updateGoals,
} = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/pin-login', pinLogin);

// Protected routes
router.post('/set-pin', requireAuth, setPin);
router.get('/profile', requireAuth, getProfile);
router.put('/goals', requireAuth, updateGoals);

module.exports = router;
