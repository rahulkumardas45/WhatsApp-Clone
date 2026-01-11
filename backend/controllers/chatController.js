const { uploadFileToCloudinary } = require('../config/cloudinary');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const response = require('../utils/responseHandler');


exports.sendMessage = async (req, res) => {
    try {
        const { senderId, receiverId, content, messageStatus } = req.body;
        const file = req.file;


        const participants = [senderId, receiverId].sort();

        // check if conversation already exits

        let conversation = await Conversation.findOne({
            participants: participants
        });

        if (!conversation) {
            conversation = new Conversation({
                participants,

            })

            await conversation.save();
        }

        let imageOrvideoUrl = null;
        let contentType = null;

        // handle file upload 

        if (file) {
            const uploadFile = await uploadFileToCloudinary(file);

            if (!uploadFile?.secure_url) {
                return response(res, 500, "file upload failed");
            };

            imageOrvideoUrl = uploadFile.secure_url;

            if (file.mimetype.startsWith('image/')) {
                contentType = 'image';
            } else if (file.mimetype.startsWith('video/')) {
                contentType = 'video';
            } else {
                return response(res, 400, "Unsupported file type");
            }


        } else if (content?.trim()) {
            contentType = 'text';
        } else {
            return response(res, 400, "Message content or file is required");
        }


        const message = new Message({
            conversation: conversation?._id,
            sender: senderId,
            receiver: receiverId,
            content: content || '',
            imageOrvideoUrl,
            contentType,
            messageStatus: messageStatus || 'sent'
        })

        console.log(message);
        
        await message.save();

        if (message?.content) {
            conversation.lastMessage = message?._id;
        }

        conversation.unreadCount += 1;

        await conversation.save();


        const populatedMessage = await Message.findOne(message?._id)
            .populate('sender', 'username profilepicture')
            .populate('receiver', 'username profilepicture');

        // emit the sockett event to receiver in the real time

        if (req.io && req.socketUserMap) {
            const receiverSocketId = req.socketUserMap.get(receiverId);
            if (receiverSocketId) {
                req.io.to(receiverSocketId).emit("receive_message", populatedMessage);

                message.messageStatus = 'delivered';
                await message.save();
            }

        }

     


        return response(res, 200, "message sent successfully", populatedMessage);

    } catch (error) {
        console.error(error);
        return response(res, 500, "internal server error");

    }

}

// get all the conversations for a user

exports.getConversations = async (req, res) => {
    const userId = req.user.userId;
    try {
        let conversation = await Conversation.findOne({
            participants: userId,
        }).populate("participants", "username profilepicture lastSeen isOnline")
            .populate({
                path: "lastMessage",

                populate: {
                    path: "sender receiver",
                    select: "username profilepicture"
                }
            }).sort({ updatedAt: -1 });
        return response(res, 200, "conversations fetched successfully", conversation);


    } catch (error) {
        console.error(error);
        return response(res, 500, "internal server error");

    }
}


// get message for the specific conversation
exports.getMessages = async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user.userId;

    try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.includes(userId)) {
            return response(res, 404, "Conversation not found");
        }
        const messages = await Message.find({ conversation: conversationId })
            .populate('sender', 'username profilepicture')
            .populate('receiver', 'username profilepicture')
            .sort({ createdAt: 1 });

        await Message.updateMany({
            conversation: conversationId,
            receiver: userId,
            messageStatus: { $in: ['sent', 'delivered'] }
        }, {
            $set: { messageStatus: 'read' }
        }
        );

        conversation.unreadCount = 0;
        await conversation.save();
        return response(res, 200, "Messages fetched successfully", messages);



    } catch (error) {
        console.error(error);
        return response(res, 500, "internal server error");

    }


}



// mark as read the mesasage 

exports.markMessagesAsRead = async (req, res) => {
    const { messageId } = req.body;
    const userId = req.user.userId;

    try {
        let message = await Message.find({
            _id: messageId,
            receiver: userId
        })

        await Message.updateMany(
            { _id: messageId, receiver: userId },
            { $set: { messageStatus: 'read' } }
        );


        // socket event 
        // notify to th eoriginal sender about the read status via socket

        if (req.io && req.socketUserMap) {
            for (const msg of message) {
                const senderSocketId = req.socketUserMap.get(msg.sender.toString());
                if (senderSocketId) {
                    const updatedMessage = {
                        _id: msg._id,
                        messageStatus: 'read',
                    }
                    req.io.to(senderSocketId).emit("message_read", updatedMessage);
                    await message.save();
                }
            }
        }

        return response(res, 200, "Messages marked as read", message);

    } catch (error) {
        console.error(error);
        return response(res, 500, "internal server error");

    }

}


// deltete a message

exports.deleteMessage = async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user?.userId || req.user?.id || req.user?._id;

    if (!userId) {
        return response(res, 401, "Unauthorized");
    }


    try {
        const message = await Message.findById(messageId);
        if (!message) {
            return response(res, 404, "message not found");
        }
        const senderId =
            message.sender?._id?.toString() || message.sender?.toString();

        if (senderId !== userId.toString()) {
            return response(res, 403, "You are not authorized to delete this message");
        }

        await message.deleteOne();

        // socket event to notify the receiver about deleted message

        if (req.io && req.socketUserMap) {
            const receiverSocketId = req.socketUserMap.get(message.receiver.toString());
            if (receiverSocketId) {
                req.io.to(receiverSocketId).emit("message_deleted", { messageId });
            }


        }

        return response(res, 200, "message deleted successfully");


    } catch (error) {
        console.error(error);
        return response(res, 500, "internal server error");

    }
}

