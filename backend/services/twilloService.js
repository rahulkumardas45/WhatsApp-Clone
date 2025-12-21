const twillo = require("twilio");
require('dotenv').config();


// twillo credentials
const accountSid=process.env.TWILIO_ACCOUNT_SID;
const serviceSid=process.env.TWILIO_SERVICE_SID;
const authToken=process.env.TWILIO_AUTH_TOKEN;


const client = twillo(accountSid, authToken);


// send otp to phone number

const sendOtptophoneNumber = async(phoneNumber) =>{
    try {

        console.log('sending otp to this number',phoneNumber);

        if(!phoneNumber){
            throw new Error('phone number is required');
        }

    const response = await client.verify.v2.services(serviceSid).verifications.create(
        {
            to:phoneNumber,
            channel:'sms'
        }
    )

    console.log('this is my otp response', response);
    return response
        
    } catch (error) {

        console.error(error)
        throw new Error('Failed to send otp')
        
    }

}

// verify the otp to the phone number

const verifyOtp = async( phoneNumber, otp) =>{
    try {
    console.log('this is my otp', otp)
    console.log("this is phone", phoneNumber);

    const response = await client.verify.v2.services(serviceSid).verificationChecks.create(
        {
            to:phoneNumber,
            code:otp
        }
    )

    console.log('this is my otp response', response);
    return response
        
    } catch (error) {

        console.error(error)
        throw new Error('otp verification failed')
        
    }

}

module.exports = {
    sendOtptophoneNumber,
    verifyOtp
}
