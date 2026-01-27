const jwt = require("jsonwebtoken");
require('dotenv').config();

const authMiddleware = (req, res, next) => {
    // const token  = req.cookies?.auth_token;
    // if (!token) {
    //     return res.status(401).json({ message: "No token provided, authorization denied" });
    // }
  
    const authHeader = req.headers['authorization'];

    if(!authHeader || !authHeader.startsWith('Bearer')){
        return res.status(401).json({ message: "No token provided, authorization denied" });
    }

      const token = authHeader.split(' ')[1];

    
    try {
        const decode = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decode;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid token, authorization denied" });
        
    }


}

module.exports = authMiddleware;

