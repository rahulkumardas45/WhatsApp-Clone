import React, { useEffect, useState } from 'react'
import useUserStore from '../store/useUserStore';
import useThemeStore from '../store/themeStore';
import { updateUserProfile } from '../Services/userServices';
import { toast } from 'react-toastify'
import { Layout } from './Layout';
import { motion } from 'framer-motion'
import { FaCamera } from 'react-icons/fa';


export const UserDetails = () => {

  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [preview, setPreview] = useState(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [showNameEmoji, setShowNameEmoji] = useState(false);
  const [showAboutEmoji, setShowAboutEmoji] = useState(false);
  const { user, setUser } = useUserStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    if (user) {
      setName(user.username || "");
      setAbout(user.about || "HEY I'M USING WHATSAPP CLONE")
    }
  }, [user])

  const hangleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) {
      return;
    }
    // ✅ File type validation
    if (!file.type.startsWith("image/")) {
      alert("please select a valid image file");
      return;
    }

    setProfilePicture(file);
    setPreview(URL.createObjectURL(file));


  }

  const handleSave = async (field) => {
    try {
      const formdata = new FormData();
      if (field === 'name') {
        formdata.append("username", name);
        setIsEditingName(false);
        setShowNameEmoji(false);
      } else if (field === 'about') {
        formdata.append("about", about)
        setIsEditingAbout(false);
        setShowAboutEmoji(false)
      }

      if (profilePicture && field === 'profile') {

        formdata.append("media", profilePicture)
        setIsUploading(true);
        setUploadProgress(0);
      }

      const updated = await updateUserProfile(formdata, {

        onUploadProgress: (e) => {
          if (!e.total) return;
          const percent = Math.round((e.loaded * 100) / e.total)
          setUploadProgress(percent);

        }
      });
      setUser(updated?.data);
      setProfilePicture(null);
      setPreview(null);
      toast.success("Profile updated");
      setIsUploading(false)

    } catch (error) {
      console.error(error);
      toast.error("failed to updates the profile")
    } 
  }

  const hanldeEmojiSelect = (emoji, field) => {

    if (field === 'name') {
      setName((prev) => prev + emoji.emoji);
      setShowNameEmoji(false);
    } else {
      setAbout((prev) => prev + emoji.emoji)
      setShowAboutEmoji(false);
    }
  }

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`w-full min-h-screenn flex border-r ${theme === 'dark' ? "bg-[rgb(17,27,33)] border-gray-600 text-white" : "bg-gray-100 border-gray-200 text-black"}`}
      >
        <div className='w-full rounded-lg p-6'>
          <div className='flex items-center mb-6 '>
            <h1 className='text-2xl font-bold'>
              Profile
            </h1>
          </div>
          <div className='space-y-6'>
            <div className='flex flex-col items-center'>
              <div className='relative group'>
                <img
                  src={preview || user?.profilepicture}
                  alt='profile picture'
                  className='w-52 h-52 rounded-full  object-cover'
                />
                <label
                  htmlFor='profileUpload'
                  className='absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer'
                >
                  <div className='text-white text-center'>
                    <FaCamera className='h-8 w-8 mx-auto mb-2' />
                    <span className='text-sm'>Change</span>
                  </div>
                  <input
                    type='file'
                    id='profileUpload'
                    accept='image/*'
                    onChange={hangleImageChange}
                    className='hidden'

                  />

                </label>
                {isUploading && (
                  <div
                    className="absolute inset-0 rounded-full
                 bg-black/50
                 flex flex-col items-center justify-center"
                  >
                    {/* DaisyUI Progress Bar */}
                    <progress
                      className="progress progress-primary w-24"
                      value={uploadProgress}
                      max="100"
                    />

                    <span className="text-white text-xs mt-1">
                      {uploadProgress}%
                    </span>
                  </div>
                )}

              </div>
            </div>

            {preview && (
              <div className='flex justify-center gap-4 mt-4'>
                <button
                  onClick={() => {
                    handleSave("profile")
                  }}
                  className='bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded'
                >
                  {isUploading ? "Saving.." : "Save" }
                </button>

                <button
                  onClick={() => {
                    setProfilePicture(null)
                    setPreview(null)
                  }}
                  className='bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded'
                >
                  Discard
                </button>
              </div>
            )}

            <div className={`relative p-4 ${theme === 'dark' ? "bg-gray-800":"bg-white"} shadow-sm rounded-lg`}>
               <label
               htmlFor='name'
               className='block text-sm font-medium mb-1 text-gray-500 text-start'
               >
                Your Name
               </label>
               <div className='flex items-center'>
                {isEditingName ? (
                    <input
                      id='name'
                      type='text'
                      value={name}
                      onChange={(e)=> setName(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${theme === 'dark' ? "bg-gray-700 text-white": "bg-gray-100 text-black"}`}
                    />
                ):(
               <span  className='w-full px-3 py-2'>{user?.username || name}</span>
                )}

                {isEditingName ? "":""}
               </div>
            </div>


          </div>
        </div>


      </motion.div>
    </Layout>
  )
}
