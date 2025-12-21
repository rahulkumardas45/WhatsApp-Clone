const express = require('express');
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');
const { multerMiddleware } = require('../config/cloudinary');

const  router = express.Router();

// protected route
router.post('/sendmessage', authMiddleware,multerMiddleware, chatController.sendMessage);
router.get('/conversations', authMiddleware, chatController.getConversations);
router.get('/conversations/:conversationId', authMiddleware, chatController.getMessages);

router.put('/messages/read', authMiddleware, chatController.markMessagesAsRead);
router.delete('/messages/:messageId', authMiddleware, chatController.deleteMessage);



module.exports = router;