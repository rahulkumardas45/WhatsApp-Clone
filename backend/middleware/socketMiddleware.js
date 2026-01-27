const jwt = require("jsonwebtoken");
require('dotenv').config();

const socketMiddleware = (req, res, next) => {


    const authHeader = req.headers['authorization'];
    const token = socket.handshake.auth?.token || socket.handshake.headers['authorization']?.split(' ')[1];



    if (token) {
        return next(new Error("Authentication token missing"))



        try {
            const decode = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decode;
            next();
        } catch (error) {
            return res.status(401).json({ message: "Invalid token, authorization denied" });

        }


    }
}

    module.exports = socketMiddleware;
