const express = require('express');
const router = express.Router();
const {
  logPushups,
  getPushupsByDate,
  getMonthlyStats,
  deletePushup,
  getContributions,
} = require('../controllers/pushupController');
const { requireAuth } = require('../middleware/authMiddleware');

router.use(requireAuth);

router.post('/log', logPushups);
router.get('/by-date', getPushupsByDate);
router.get('/monthly-stats', getMonthlyStats);
router.get('/contributions', getContributions);
router.delete('/:id', deletePushup);

module.exports = router;
