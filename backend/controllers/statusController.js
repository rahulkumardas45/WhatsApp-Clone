const { uploadFileToCloudinary } = require('../config/cloudinary');
const Status = require('../models/Status');
const Message = require('../models/Message');
const response = require('../utils/responseHandler');



exports.createStatus = async (req, res) => {
    try {
        const { content, contentType } = req.body;
        const userId = req.user.userId;
        const file = req.file;


        let mediaUrl = null;
        let finalContentType = contentType || 'text';


        // handle file upload 

        if (file) {
            const uploadFile = await uploadFileToCloudinary(file);

            if (!uploadFile?.secure_url) {
                return response(res, 500, "file upload failed");
            };

            mediaUrl = uploadFile.secure_url;

            if (file.mimetype.startsWith('image/')) {
                finalContentType = 'image';
            } else if (file.mimetype.startsWith('video/')) {
                finalContentType = 'video';
            } else {
                return response(res, 400, "Unsupported file type");
            }


        } else if (content?.trim()) {
            finalContentType = 'text';
        } else {
            return response(res, 400, "Message content or file is required");
        }


        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // status expires in 24 hours


        const status = new Status({
            user: userId,
            content: content || mediaUrl,
            contentType: finalContentType,
            expiresAt,

        })

        await status.save();




        const populatedStatus = await Status.findOne(status?._id)
            .populate('user', 'username profilepicture')
            .populate('viewers', 'username profilepicture');

        ////// socket event intergration


        // emit socket event to notify friends about new status


        if (req.io && req.socketUserMap) {
            // broadcast the status to the all users except the creator

            for (const [connectingUserId, socketId] of req.socketUserMap) {
                if (connectingUserId !== userId) {
                    req.io.to(socketId).emit('new_status', populatedStatus);
                }

            }

        }



        return response(res, 200, "status created  successfully", populatedStatus);

    } catch (error) {
        console.error(error);
        return response(res, 500, "internal server error");

    }

}

exports.getStatuses = async (req, res) => {
    try {
        const statuses = await Status.find({ expiresAt: { $gt: new Date() } })
            .populate('user', 'username profilepicture')
            .populate('viewers', 'username profilepicture')
            .sort({ createdAt: -1 });
        return response(res, 200, "statuses fetched successfully", statuses);
    } catch (error) {
        console.error(error);
        return response(res, 500, "internal server error");
    }
}

exports.viewStatus = async (req, res) => {
    const statusId = req.params.statusId;
    const userId = req.user.userId;

    try {
        const status = await Status.findById(statusId);
        if (!status) {
            return response(res, 404, "status not found");
        }
        if (!status.viewers.includes(userId)) {
            status.viewers.push(userId);
            await status.save();


            const updateStatus = await Status.findById(statusId)
                .populate('user', 'username profilepicture')
                .populate('viewers', 'username profilepicture');


            /// socket integration to notify status owner about new viewer

            if (req.io && req.socketUserMap) {
                // broadcast the status to the all users except the creator
                const statusOwnerSocketId = req.socketUserMap.get(status.user._id.toString());
                if (statusOwnerSocketId) {
                    const viewData = {
                        statusId,
                        viewerId: userId,
                        totalViewers: updateStatus.viewers.length,
                        viewers: updateStatus.viewers,
                    };
                    req.io.to(statusOwnerSocketId).emit('status_viewed', viewData)

                } else {
                    console.log("status owner is not online// connnected");
                }


            }

        } else {
            console.log("user has already viewed the status");
        }


        return response(res, 200, "status viewed successfully");

    } catch (error) {
        console.error(error);
        return response(res, 500, "internal server error");
    }
}


exports.deleteStatus = async (req, res) => {
    const statusId = req.params.statusId;
    const userId = req.user.userId;
    try {

        const status = await Status.findById(statusId);
        if (!status) {
            return response(res, 404, "status not found");
        }
        if (status.user.toString() !== userId) {
            return response(res, 403, "unauthorized to delete this status");
        }

        await status.deleteOne();

        //socket integration to notify friends about deleted status
        if (req.io && req.socketUserMap) {
            // broadcast the status deletion to all users except the owner
            for (const [connectingUserId, socketId] of req.socketUserMap) {
                if (connectingUserId !== userId) {
                    req.io.to(socketId).emit('status_deleted', { statusId });
                }
            }
        }




        return response(res, 200, "status deleted successfully");

    } catch (error) {
        console.error(error);
        return response(res, 500, "internal server error");
    }
}