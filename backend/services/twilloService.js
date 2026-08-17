const twillo = require("twilio");
require("dotenv").config();


// twillo credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const serviceSid = process.env.TWILIO_SERVICE_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;


console.log(
    "TWILIO ACCOUNT SID:",
    accountSid ? "Loaded" : "Missing"
);

console.log(
    "TWILIO SERVICE SID:",
    serviceSid ? "Loaded" : "Missing"
);

console.log(
    "TWILIO AUTH TOKEN:",
    authToken ? "Loaded" : "Missing"
);


const client = twillo(accountSid, authToken);


// send otp to phone number

const sendOtptophoneNumber = async(phoneNumber) =>{
    try {

        console.log(
            "sending otp to this number",
            phoneNumber
        );

        if(!phoneNumber){
            throw new Error("phone number is required");
        }

        if(!accountSid){
            throw new Error("TWILIO_ACCOUNT_SID is missing");
        }

        if(!serviceSid){
            throw new Error("TWILIO_SERVICE_SID is missing");
        }

        if(!authToken){
            throw new Error("TWILIO_AUTH_TOKEN is missing");
        }

        const result = await client.verify.v2
            .services(serviceSid)
            .verifications
            .create({
                to: phoneNumber,
                channel: "sms"
            });

        console.log(
            "TWILIO OTP STATUS 👉",
            result.status
        );

        console.log(
            "TWILIO OTP SID 👉",
            result.sid
        );

        return result;

    } catch (error) {

        console.error(
            "TWILIO SEND OTP ERROR 👉",
            error
        );

        console.error(
            "TWILIO ERROR MESSAGE 👉",
            error.message
        );

        console.error(
            "TWILIO ERROR CODE 👉",
            error.code
        );

        console.error(
            "TWILIO ERROR STATUS 👉",
            error.status
        );

        throw error;
    }
}


// verify the otp to the phone number

const verifyOtp = async(phoneNumber, otp) =>{
    try {

        console.log(
            "this is my otp",
            otp
        );

        console.log(
            "this is phone",
            phoneNumber
        );

        const result = await client.verify.v2
            .services(serviceSid)
            .verificationChecks
            .create({
                to: phoneNumber,
                code: otp
            });

        console.log(
            "TWILIO VERIFY STATUS 👉",
            result.status
        );

        return result;

    } catch (error) {

        console.error(
            "TWILIO VERIFY ERROR 👉",
            error
        );

        console.error(
            "TWILIO ERROR MESSAGE 👉",
            error.message
        );

        console.error(
            "TWILIO ERROR CODE 👉",
            error.code
        );

        console.error(
            "TWILIO ERROR STATUS 👉",
            error.status
        );

        throw error;
    }
}


module.exports = {
    sendOtptophoneNumber,
    verifyOtp
}