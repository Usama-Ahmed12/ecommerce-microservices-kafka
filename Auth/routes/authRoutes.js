const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  verifyEmail, 
  loginUser, 
  logoutUser,
  refreshToken,
  resendVerificationEmail
} = require('../controllers/authController');

router.post('/register', registerUser);
router.get('/verify/:token', verifyEmail);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/refresh', refreshToken);
router.post('/resend-verification', resendVerificationEmail);

module.exports = router;