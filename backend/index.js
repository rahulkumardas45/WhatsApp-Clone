// create a server 

const express = require('express');
const cookieParser = require('cookie-parser')
const cors = require('cors')
const dotenv = require('dotenv');
const connectdb = require('./config/dbconnect');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const statusRoutes = require('./routes/statusRoutes');
const http = require('http')
const initializeSocket = require('./services/socketServices');



dotenv.config();



const PORT = process.env.PORT;

const app = express();


const corsOptions = {
    origin: process.env.FRONTEND_URL,
    credentials: true
}

app.use(cors(corsOptions));

// middlewares
app.use(express.json()); // to parse json data
app.use(cookieParser()); // to parse cookies
app.use(bodyParser.urlencoded({ extended: true })); // to parse urlencoded data

//databse connection
  connectdb();


// create http server
const server = http.createServer(app);
// initialize socket
const io = initializeSocket(server);
//apply socket middleware before routes

app.use((req, res, next) => {
  req.io = io;
  req.socketUserMap = io.socketUserMap;
  next();
})



// rotues
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/status', statusRoutes);

  
// server setup to run
server.listen(PORT, ()=>{
    console.log('server is running at port', PORT);
})