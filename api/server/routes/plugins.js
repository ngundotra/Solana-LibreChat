const express = require('express');
const {
  getAvailablePluginsController,
  getPluginFunctionsController,
} = require('../controllers/PluginController');
// const requireJwtAuth = require('../../middleware/requireJwtAuth');

const router = express.Router();

router.get('/', getAvailablePluginsController);
router.get('/details', getPluginFunctionsController);

module.exports = router;
