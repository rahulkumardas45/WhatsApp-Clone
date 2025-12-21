const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { multerMiddleware } = require('../config/cloudinary');

const  router = express.Router();

router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifiedotp);
router.get('/logout', authController.logout);

// protected route

router.put('/update-profile',authMiddleware,multerMiddleware, authController.updateProfile);
router.get('/check-auth',authMiddleware, authController.checkAuthenticated);
router.get('/users', authMiddleware, authController.getallUser);


module.exports = router;