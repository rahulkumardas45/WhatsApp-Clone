import React, { useState } from 'react'
import useLoginStore from '../../store/useLoginStore'
import useUserStore from '../../store/useUserStore';
import useThemeStore from '../../store/themeStore';
import countries from '../../utils/countriles';
import * as Yup from 'yup';

import { yupResolver } from "@hookform/resolvers/yup";
import { data, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaChevronDown, FaPlus, FaUser, FaWhatsapp } from "react-icons/fa";
import Spinner from '../../utils/Spinner';
import { sendOtp, updateUserProfile, verifyOtp } from '../../Services/userServices';
import { toast } from 'react-toastify';



// validate shema
const loginValidationSchema = Yup.object().shape({
  phoneNumber: Yup.string()
    .nullable().notRequired()
    .matches(/^\d+$/, 'Phone number must contain only digits')
    .transform((value, originalValue) => originalValue.trim() === '' ? null : value
    ),
  email: Yup.string()
    .nullable().notRequired()
    .email('Invalid email format')
    .transform((value, originalValue) => originalValue.trim() === '' ? null : value
    )


})
  .test(
    'at-least-one',
    'Either phone number or email must be provided',
    function (value) {
      return !!(value.phoneNumber || value.email);
    }
  )

const otpValidationSchema = Yup.object().shape(
  {
    otp: Yup.string().length(6, 'OTP must be exactly 6 digits').required('OTP is required'),
  }
);

const profileValidationSchema = Yup.object().shape({
  username: Yup.string().required('username is required'),
  agreed: Yup.boolean().oneOf([true], 'You must accept the terms and conditions'),
});

const avatars = [
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Mimi',
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Jasper',
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Luna',
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Zoe',
]


const Login = () => {
  const { step, userPhoneData, setStep, setUserPhoneData, resetLoginState } = useLoginStore();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("");

  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();
  const { setUser } = useUserStore();
  const { theme, setTheme } = useThemeStore();

  //  const [username, setUsername] = useState("");
  //  const [agreed, setAgreed] = useState(false);


  /// login form
  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },

  } = useForm({
    resolver: yupResolver(loginValidationSchema),
  })


  // opt form
  const {

    handleSubmit: handleOtpSubmit,
    formState: { errors: OtpErrors },
    setValue: setOtpValue,

  } = useForm({
    resolver: yupResolver(otpValidationSchema),
  })

  // profile form

  const {
    register: profileRegister,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    watch

  } = useForm({
    resolver: yupResolver(profileValidationSchema),
  })


  const filterCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.dialCode.includes(searchTerm)
  );

  const onLoginSubmit = async () => {
    try {
      setLoading(true)
      if (email) {
        const response = await sendOtp(null, null, email);
        if (response.status === "success") {
          toast.info("OTP is send to your email")
          setUserPhoneData({ email })
          setStep(2)
        }
      } else {
        const response = await sendOtp(phoneNumber, selectedCountry.dialCode, null);
        if (response.status === "success") {
          toast.info("OTP is send to your Phone number")
          setUserPhoneData({ phoneNumber, phoneSuffix: selectedCountry.dialCode })
          setStep(2)
        }

      }


    } catch (error) {
      console.log(error)
      setError(error.message || "Faild to send OTP")

    } finally {
      setLoading(false)
    }

  }


  const onOtpSubmit = async () => {
    try {
      setLoading(true)

      if(!userPhoneData) {
        throw new Error("Phone or email data is mising")
      }

      const otpString = otp.join("");
      let response;
      if (userPhoneData.email) {
        response = await verifyOtp(null, null, otpString, userPhoneData.email);
      } else {
        response = await verifyOtp(userPhoneData.phoneNumber, userPhoneData.phoneSuffix, otpString, null);
      }
      if(response.status === "success") {
        toast.success("otp verify successfully")
        const user = response.data?.user;
        if (user?.username && user?.profilePicture) {
          setUser(user);
          toast.success("Welcome Back to whatsapp");
          navigate('/')
          resetLoginState()

        } else {
          setStep(3);
        }
      }

    } catch (error) {
      console.log(error)
      setError(error.message || "Faild to send OTP")

    } finally {
      setLoading(false)
    }

  }


  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePictureFile(file);
      setProfilePicture(URL.createObjectURL(file))
    }
  }

  const onProfileSubmit = async(data) => {
    try {
      setLoading(true)
      const formData = new FormData();
      formData.append("username", data.username)
      formData.append("agreed", data.agreed)
      if (profilePicture) {
        formData.append("media", profilePictureFile)
      } else {
        formData.append("media", selectedAvatar)
      }
      const res = await updateUserProfile(formData);

    console.log("PROFILE UPDATE RESPONSE:", res);

    if (res?.status === "success") {
      toast.success("Welcome back to WhatsApp");
      resetLoginState();
      navigate("/", { replace: true })
    }

    } catch (error) {
      console.log(error)
      setError(error.message || "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  // otp ke digit dalne pr automatic aage direct karne ke
  const handleOtpChange = async (index, value) => {
    const newOtp = [...otp]
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpValue("otp", newOtp.join(""))
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus()
    }
  }

  const ProgressBar = () => (
    <div className={`w-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2.5 mb-6`}>
      <div className='bg-green-500 h-2.5 rounded-full transition-all duration-500 ease-in-out'
        style={{ width: `${(step / 3) * 100}%` }}
      >
      </div>
    </div>
  )


  const handleBack = () => {
    setStep(1)
    setUserPhoneData(null)
    setOtp(["", "", "", "", "", ""])
    setError("")

  }


  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-green-400 to-blue-500'} flex items-center justify-center p-4 overflow-hidden`}>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`${theme === 'dark' ? "bg-gray-800 text-white" : "bg-white"} p-6 md:p-8 rounded-lg shadow-2xlw-full max-w-md relative z-10}`}
      >

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
          className='w-24 h-24 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center'

        >
          <FaWhatsapp className='w-16 h-16 text-white' />


        </motion.div>

        <h1 className={`text-3xl font-bold text-center mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Whatsapp Login </h1>

        <ProgressBar />

        {error && <p className='text-red-500 text-center mb-4 '>{error}</p>}

        {step === 1 && (
          <form
            className="space-y-4" onSubmit={handleLoginSubmit(onLoginSubmit)}
          >
            <p className={`text-center ${theme === 'dark' ? "text-gray-100" : "text-gray-500"} mb-4`}>
              Enter your phone number to receive an otp
            </p>
            <div className='relative'>
              <div className='flex'>
                <div className='relative w-1/3'>
                  <button
                    type='button'
                    className={`flex-shrink-0 z-10 inline-flex items-center py-2.5 px-4 text-sm font-medium text-center ${theme === 'dark' ? "text-white bg-gray-700 border-gray-600" : "text-gray-900 bg-gray-100 border-gray-300"} border rounded-s-lg hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100`}
                    onClick={() => setShowDropdown(!showDropdown)}
                  >
                    <span>
                      {selectedCountry.flag} {selectedCountry.dialCode}
                    </span>
                    <FaChevronDown className='ml-2' />

                  </button>

                  {showDropdown && (
                    <div className={`absolute z-10 w-full mt-1 ${theme === 'dark' ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300"} border rounded-md shadow-lg  max-h-60 overflow-auto`}>

                      <div className={`sticky top-0 ${theme === 'dark' ? "bg-gray-700" : "bg-white"} p-2`}>
                        <input
                          type='text'
                          placeholder='saerch countries..'
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className={`w-full px-2 py-1 border ${theme === 'dark' ? "bg-gray-600 border-gray-500 text-white" : "bg-gray-100 border-gray-300 text-gray-900"} rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-500`}
                        />

                      </div>

                      {filterCountries.map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(country);
                            setShowDropdown(false);
                            setSearchTerm("");
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-200"
                        >
                          {country.flag} ({country.dialCode}) {country.name}
                        </button>
                      ))}

                    </div>

                  )}

                </div>

                <input
                  type='text'
                  {...loginRegister("phoneNumber")}
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  className={`w-2/3 px-4 border ${theme === 'dark' ? "bg-gray-800 border-gray-600" : "bg-white border-gray-300"} rounded-md  focus:right-2 focus:ring-green-500 ${loginErrors.phoneNumber ? "border-red-500" : ""}`}
                  placeholder='enter mobile number..'
                />


              </div>
              {loginErrors.phoneNumber &&
                (
                  <p className='text-red-500 text-sm'>{loginErrors.phoneNumber.message}</p>
                )

              }

            </div>


            {/* //devier with aur  */}

            <div className='flex items-center my-4'>
              <div className='flex-grow h-px bg-gray-500' />
              <span className='mx-3 text-gray-500 text-sm font-medium'>Or</span>
              <div className='flex-grow h-px bg-gray-500' />

            </div>

            {/* email input box */}
            <div className={`flex items-center border rounded-md px-3 py-2 ${theme === 'dark' ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} `}>
              <FaUser className={`mr-2 text-gray-500 ${theme === 'dark' ? "text-gray-400" : "text-gray-500"}`} />
              <input
                type='email'
                {...loginRegister("email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full bg-transparent focus:outline-none ${theme === 'dark' ? "text-white" : "text-black"} rounded-md  focus:right-2 focus:ring-green-500 ${loginErrors.email
                  ? "border-red-500" : ""}`}
                placeholder='enter email(optional)'
              />

              {loginErrors.email &&
                (
                  <p className='text-red-500 text-sm'>{loginErrors.email.message}</p>
                )

              }

            </div>


            <button
              type='submit'
              className="w-full bg-green-400 text-white py-2 rounded-md hover:bg-green-600 transition">
              {loading ? <Spinner /> : "Send Otp"}

            </button>

          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleOtpSubmit(onOtpSubmit)} className='space-y-4'>
            <p className={`text-center ${theme === 'dark' ? "text-gray-300" : "text-gray-600"} mb-4`}>
              Please enter the 6-digit OTP send to your {userPhoneData ? userPhoneData.phoneSuffix : "Email"}{" "} {userPhoneData.phoneNumber && userPhoneData?.phoneNumber}
            </p>

            <div className='flex justify-between'>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type='text'
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  className={`w-12 h-12 text-center border ${theme === 'dark' ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${OtpErrors.otp ? "border-red-500" : ""}`}

                />
              )

              )}
            </div>

             {
                OtpErrors.otp && (
                  <p className='text-red-500 text-sm '>
                    {OtpErrors.otp.message}

                  </p>
                )
              }
              <button
              type='submit'
              className="w-full bg-green-400 text-white py-2 rounded-md hover:bg-green-600 transition" >
              {loading ? <Spinner /> : "Verify Otp"}
            </button>

            <button 
            type='button'
            onClick={handleBack}
            className={`w-full mt-2 ${theme === 'dark' ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"} py-2 rounded-md hover:bg-gray-300 transition flex items-center justify-center`}
            >
               <FaArrowLeft className='mr-2'/>
               Wrong number? Go back
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className='space-y-4'>

          <div className='flex flex-col items-center mb-4 '>
            <div className='relative w-24 h-24 mb-2'>
              <img 
              src={profilePicture || selectedAvatar}
              alt='profile'
              className='w-full h-full rounded-full object-cover'
               />

               <label 
               htmlFor='profile-picture'
               className='absolute bottom-0 right-0 bg-green-500 text-white p-2 rounded-full cursor-pointer hover:bg-green-600 transition duration-300'
               >
                <FaPlus className='w-4 h-4'/>
               </label>
               <input
                type='file'
                id='profile-picture'
                accept='image/*'
                onChange={handleFileChange}
                className='hidden'
               />

            </div>

            <p className={`text-sm ${theme === 'dark' ? "text-gray-300" : "text-gray-600"} mb-2`}>
              Choose an avatar
            </p>

            <div className='flex flex-wrap justify-center gap-2'>
              {
                avatars.map((avatar, index) => (
                  <img
                   key={index}
                   src={avatar}
                   alt={`Avatar ${index+1}`}
                   className={`w-12 h-12 rounded-full cursor-pointer transition duration-300 ease-in-out transform hover:scale-110 ${selectedAvatar === avatar ? "ring-2 ring-green-500":"" }`}
                   onClick={() => setSelectedAvatar(avatar)}
                  />
                ))
              }

            </div>

          </div>

          <div className="relative">
            <FaUser
             className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? "text-gray-300" : "text-gray-700"}`}
            />
            <input
             {...profileRegister("username")}
             type='text'
             placeholder='username'
             className={`w-full pl-10 pr-3 py-2 border ${theme === 'dark' ? "bg-gray-700 border-gray-700 text-white": "bg-white border-gray-300 text-gray-700"} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-lg`}

            />
            {
              profileErrors.username && (
                <p className='text-red-500 text-sm mt-1'>
                  {
                    profileErrors.username.message
                  }

                </p>
              )
            }

          </div>

          <div className='flex items-center space-x-2'>
            <input
              {...profileRegister('agreed')}
              type='checkbox'
              className={`rounded ${theme === 'dark' ? "text-green-500 bg-gray-700" : "text-green-500 bg-gray-100"} focus:ring-green-500`}
            />
            <label
            htmlFor='terms' 
            className={`text-sm ${theme === 'dark' ? "text-gray-300":"text-gray-700"}`}
            >
              I agree to the {" "}
              <a href="#" className='text-red-500 hover:underline'
              > Terms and Conditions</a>

            </label>
           
          </div>

           {
              profileErrors.agreed && (
                   <p className='text-red-500 text-sm mt-1'>
                  {
                    profileErrors.agreed.message
                  }

                </p>
              )
            }
         

          <button
              type='submit'
              disabled = {!watch("agreed") || loading }
              className={`w-full bg-green-500 text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center text-lg ${loading ? "opacity-50 cursor-not-allowed": ""}`} >
              {loading ? <Spinner /> : "Create Profile"}
            </button>
          </form>

        )}

      </motion.div>



    </div>
  )
}

export default Login