const express = require('express');
const {
  getAvailablePluginsController,
  getPluginFunctionsController,
  getSolanaPayController,
} = require('../controllers/PluginController');
// const requireJwtAuth = require('../../middleware/requireJwtAuth');

const router = express.Router();

router.get('/', getAvailablePluginsController);
router.get('/details', getPluginFunctionsController);
router.post('/solana-pay', getSolanaPayController);

module.exports = router;
