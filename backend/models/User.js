const  mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({

    phoneNumber:{
         type: String,
        unique: true,
        sparse: true
    },
    phoneSuffix : {
        type: String,
        unique: false
    }
    ,
    username:{
        type: String,

    }
    ,
    email:{
        type: String,
        lowercase: true,
        validate: {
      validator: function(v) {
        // Regex for basic email format validation
        return /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/.test(v);
      },
      message: props => `${props.value} is not a valid email!`
    }
},
emailOtp: {
    type: String,
},

emailOtpExpiry:{
    type: Date
},
profilepicture: {
    type: String
},
about: {
     type: String
}
,
lastSeen: {
    type:Date
}
,
isOnline: {
    type:Boolean,
    default: false
},

isVerified: {
    type:Boolean,
    default:false
},

agreed: {
    type: Boolean,
    default: false
}
}, {
    timestamps: true
})

const User = mongoose.model('User', UserSchema)

module.exports= User;