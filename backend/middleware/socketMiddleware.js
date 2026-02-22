const jwt = require("jsonwebtoken");

const socketMiddleware = (socket, next) => {
  try {
    // Token from socket auth
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Authentication token missing"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // attach user to socket
    next();
  } catch (error) {
    next(new Error("Invalid or expired token"));
  }
};

module.exports = socketMiddleware;
