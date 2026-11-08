const express = require('express');
const router = express.Router();
const {
  logEggs,
  getEggsByDate,
  getMonthlyEggStats,
  deleteEggLog,
  getEggContributions,
} = require('../controllers/eggController');
const { requireAuth } = require('../middleware/authMiddleware');

router.use(requireAuth);

router.post('/log', logEggs);
router.get('/by-date', getEggsByDate);
router.get('/monthly-stats', getMonthlyEggStats);
router.get('/contributions', getEggContributions);
router.delete('/:id', deleteEggLog);

module.exports = router;
