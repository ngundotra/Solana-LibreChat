const express = require('express');
const {
  resetPasswordRequestController,
  resetPasswordController,
  // refreshController,
  registrationController,
} = require('../controllers/AuthController');
const { loginController } = require('../controllers/auth/LoginController');
const { logoutController } = require('../controllers/auth/LogoutController');
const requireJwtAuth = require('../../middleware/requireJwtAuth');
// const requireLocalAuth = require('../../middleware/requireLocalAuth');
const { requireSolanaAuth } = require('../../middleware/requireSolanaAuth');
const { creationController } = require('../controllers/siws/CreationController');

const router = express.Router();

// Sign in with Solana endpoints (SIWS endpoints)
router.post('/siwsVerify', requireSolanaAuth, loginController);
router.post('/siwsCreate', creationController);

//Local
router.post('/logout', requireJwtAuth, logoutController);
// router.post('/login', requireLocalAuth, loginController);
// router.post('/refresh', requireJwtAuth, refreshController);
if (process.env.ALLOW_REGISTRATION) {
  router.post('/register', registrationController);
}
router.post('/requestPasswordReset', resetPasswordRequestController);
router.post('/resetPassword', resetPasswordController);

module.exports = router;
