const mongoose = require('mongoose')


//conect db

const connectdb = async() =>{
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("database connected succsessfully");
    } catch (error) {
        console.log("database connection error", error.message);
        process.exit(1);
    }
}


module.exports = connectdb;