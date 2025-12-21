

//setop otp sender

const otpGenerate = require("../utils/otpGenerator");
const User = require("../models/User.js");
const Conversation = require("../models/Conversation");


const response = require("../utils/responseHandler");
const twilloService = require("../services/twilloService");
const sendOtpEmail = require("../services/emailService");
const generateToken = require("../utils/generateToken");
const { uploadFileToCloudinary } = require("../config/cloudinary");


const sendOtp = async (req, res) => {
    const { phoneNumber, phoneSuffix, email } = req.body;
    const otp = otpGenerate();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);
    let user;

    try {
        if (email) {
           user  = await User.findOne({ email });

            if (!user) {
                user = await new User({ email })
            }
            user.emailOtp = otp;
            user.emailOtpExpiry = expiry;
            await user.save();
            // sent email otp 
            await sendOtpEmail(email, otp);

            return response(res, 200, "opt send to your email", { email });
        }

        if (!phoneNumber || !phoneSuffix) {
            return response(res, 400, "phonenumber and phonesuffix are required")
        }


        const fullphoneNumber = `${phoneSuffix}${phoneNumber}`;
        user = await User.findOne({ phoneNumber });
        if (!user) {
            user = await new User({ phoneNumber, phoneSuffix })
        }
        // send phone otp
        await twilloService.sendOtptophoneNumber(fullphoneNumber);
        await user.save();

        return response(res, 200, "otp send Successfully", user)

    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal server error ")
    }



}

const verifiedotp = async (req, res) => {
    const { phoneNumber, phoneSuffix, otp, email } = req.body;

    try {
        let user;

        if (email) {
            user = await User.findOne({ email });
            if (!user) {
                return response(res, 404, "user not found with this email")
            }

            const now = new Date();

            if (!user.emailOtp || String(user.emailOtp) !== String(otp) || now > new Date(user.emailOtpExpiry)) {
                return response(res, 400, "Invalid or expired otp")
            }
            user.isVerified = true;
            user.emailOtp = null;
            user.emailOtpExpiry = null;
            await user.save();
        } else {
            if (!phoneNumber || !phoneSuffix) {
                return response(res, 400, "phonenumber and phonesuffix are required")
            }

            const fullphoneNumber = `${phoneSuffix}${phoneNumber}`;
            
            user = await User.findOne({ phoneNumber});
            if (!user) {
                return response(res, 404, "user not found with this phone number")
            }
            const result = await twilloService.verifyOtp(fullphoneNumber, otp);

            if (result.status !== "approved") {
                return response(res, 400, "Invalid or expired otp")
            }
            user.isVerified = true;
            await user.save();
        }

        const token = generateToken(user?._id);
        res.cookie("auth_token", token, {
            httpOnly: true,
            // secure: process.env.NODE_ENV === 'production',
            // sameSite: 'strict',
            maxAge: 365 * 24 * 60 * 60 * 1000
        });

        return response(res, 200, "otp verified successfully", { user, token })
        
    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal server error ")

    }


}


const updateProfile = async(req,res) =>{
    const { username, agreed, about} = req.body;
   const userId =
  req.user?.userId ||
  req.user?.id ||        // 👈 ye add karo
  req.user?._id;

    try {
        const user = await User.findById(userId);
        if(!user){
            return response(res,404,"user not found")
        }
        const file =req.file;
        if(file){
            // upload to cloudinary
           const uploadResult = await uploadFileToCloudinary(file);

           console.log('this is upload result', uploadResult);

              user.profilepicture = uploadResult.secure_url;

        }else if(req.body.profilepicture){
            user.profilepicture = req.body.profilepicture;
        }
        if(username){
            user.username = username;
        }
        if(about){
            user.about = about;
        }
        if(agreed){
            user.agreed = agreed;
        }
        await user.save();
     
        console.log('this is updated user', user);

        return response (res,200,"profile updated successfully", user)
        
    } catch (error) {
        console.error(error);
        return response(res,500,"internal server error")
        
    }


}

const checkAuthenticated = async (req, res) => {
  try {

      if (!req.user || !req.user.userId) {
      return response(res, 401, 'Unauthorized! Please login before accessing  app');
    }
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return response(res, 404, 'User not found');
    }

    return response(res, 200, 'user retrieved and allowed to use whatsapp', user);
  } catch (error) {
    console.error(error);
    return response(res, 500, 'Internal server error');
  }
};

// const checkAuthenticated = async (req, res) => {
//   try {
//     // Check if req.user exists
//     if (!req.user || !req.user.userId) {
//       return response(res, 401, 'Unauthorized! Please login before accessing our app');
//     }

//     const userId = req.user.userId;

//     // Find user in database
//     const user = await User.findById(userId);
//     if (!user) {
//       return response(res, 404, 'User not found');
//     }

//     // Success
//     return response(res, 200, 'User retrieved and allowed to use WhatsApp', user);

//   } catch (error) {
//     console.error('Error in checkAuthenticated:', error);
//     return response(res, 500, 'Internal server error');
//   }
// };


const getallUser = async( req, res)=>{
    const loggedInUser = req.user.userId;
      try {
        const users = await User.find({_id:{$ne:loggedInUser}}).select(
            "username profilepicture lastSeen isOnline about phoneNumber phoneSuffix"
        ).lean();


      const userWithConversation = await Promise.all(
        users.map(async(user)=>{
            const conversation = await Conversation.findOne({
                participants:{$all:[loggedInUser,user?._id]}
            }).populate(
                {
                    path:"lastMessage",
                    select: "content createdAT sender receiver"
                }
            ).lean();
            
            return {
                ...user,
                conversation: conversation || null
            }
        }
      )
    )
     
    return response (res, 200, "user retrived succcessfully", userWithConversation);

    
      } catch (error) {
         console.error(error);
    return response(res, 500, 'Internal server error');
        
      }
}

const logout = async(req,res) =>{
    res.clearCookie("auth_token", {
        httpOnly: true,
        // secure: process.env.NODE_ENV === 'production',
        // sameSite: 'strict',
    });
    return response(res,200,"logout successfully")
}



module.exports = {
    sendOtp,
    verifiedotp,
    updateProfile,
    logout,
    checkAuthenticated,
    getallUser
}