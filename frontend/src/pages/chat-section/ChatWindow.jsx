import React, { useEffect, useRef, useState } from 'react'
import useUserStore from '../../store/useUserStore';
import useThemeStore from '../../store/themeStore'
import { useChatStore } from '../../store/chatStore';
import whatsapp_image from '../../images/whatsapp_image.png'
import { isToday, isYesterday, format } from 'date-fns'
import { FaArrowLeft, FaEllipsisV, FaFile, FaImage, FaLock, FaPaperclip, FaPaperPlane, FaSmile, FaTimes, FaVideo } from 'react-icons/fa'
import MessageBubble from './MessageBubble';
import EmojiPicker from 'emoji-picker-react';
import useOutsideclick from '../../Hooks/useOutSideClick';
import VideoCallManager from '../VideoCall/VideoCallManager';

import { getSocket } from '../../Services/chatServices';
import useVideoCallStore from '../../store/videoCallStore';

const isValidate = (date) => {
  return date instanceof Date && !isNaN(date)
}

export const ChatWindow = ({ selectedContact, setSelectedContact }) => {

  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojipicker] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const typingTimeoutRef = useRef(null);
  const messageEndRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const fileInputRef = useRef(null);


  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const socket = getSocket();


  // sare message and chat ko import karo from chat store se

  const { messages,
    loading,
    sendMessage,
    receiveMessage,
    fetchMessage,
    markMessageAsRead,
    fetchConversations,
    conversations,
    isUserTyping,
    startTyping,
    stopTyping,
    getUserLastSeen,
    isUserOnline,
    cleanup,
    addReaction,
    deleteMessage, } = useChatStore();


  // get online status and lastseen

  const online = isUserOnline(selectedContact?._id);
  const lastseen = getUserLastSeen(selectedContact?._id);
  const isTyping = isUserTyping(selectedContact?._id);


useOutsideclick(emojiPickerRef, () => {
  if (showEmojiPicker) setShowEmojipicker(false);
});



  useEffect(() => {
    if (selectedContact?._id && conversations?.data?.length > 0) {
      const conversation = conversations?.data?.find((conv) =>
        conv.participants.some((participant) => participant._id === selectedContact?._id)
      )
      if (conversation._id) {
        fetchMessage(conversation._id);
      }


    }
  }, [selectedContact, conversations])


  useEffect(() => {
    fetchConversations();
  }, []);

  // scroll automatic me chat start

  // const scrollToBottom = () => {
  //   messageEndRef.current?.scrollIntoView({ behavior: "smooth" })
  // }

  // useEffect(() => {
  //   scrollToBottom();
  // }, [messages])





  // useEffect(() => {
  //   if (message && selectedContact) {
  //     startTyping(selectedContact?._id);
  //     if (typingTimeoutRef.current) {
  //       clearTimeout(typingTimeoutRef.current)
  //     }

  //     typingTimeoutRef.current = setTimeout(() => {
  //       stopTyping(selectedContact?._id)

  //     }, 2000);
  //   }
  //   return () => {
  //     if (typingTimeoutRef.current) {
  //       clearTimeout(typingTimeoutRef.current)
  //     }
  //   }

  // }, [message, selectedContact, startTyping, stopTyping])

  useEffect(() => {
  if (!selectedContact?._id) return;

  if (message) {
    startTyping(selectedContact._id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(selectedContact._id);
    }, 2000);
  }

  return () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };
}, [message, selectedContact?._id]);


  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setShowFileMenu(false);

      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        setFilePreview(URL.createObjectURL(file))
      }

    }
  }

  // api cal for send the messsage data 
  const handleSendMessage = async () => {
    if (!selectedContact) return;
    setFilePreview(null);
    try {
      const formData = new FormData();
      formData.append("senderId", user?._id)
      formData.append("receiverId", selectedContact?._id)

      const status = online ? "delivered" : "send";
      formData.append("messageStatus", status);
      if (message.trim()) {
        formData.append("content", message.trim());
      }
      // if there is file include to too
      if (selectedFile) {
        formData.append("media", selectedFile, selectedFile.name)
      }

      if (!message.trim() && !selectedFile) return;

      await sendMessage(formData);

      //clear state
      setMessage("");
      setFilePreview(null);
      setSelectedFile(null);
      setShowFileMenu(false)


    } catch (error) {
      console.error("Failed to send message", error)

    }
  }

  //head to date for the today message

  const renderDateSeparator = (date) => {
    if (!isValidate(date)) {
      return null;
    }

    let dateString;
    if (isToday(date)) {
      dateString = "Today"
    } else if (isYesterday(date)) {
      dateString = "Yesterday"
    } else {
      dateString = format(date, "EEEE, MMMM d")

    }


    return (
      <div className='flex justify-center my-4'>
        <span className={`px-2 py-2 rounded-full text-sm ${theme === 'dark' ? "bg-gray-700 text-gray-200" : "bg-gray-300 text-gray-700"}`}>
          {dateString}
        </span>

      </div>

    )
  }

  //Group messages
  const groupedMessages = Array.isArray(messages) ? messages.reduce((acc, message) => {
    if (!message.createdAt) return acc;
    const date = new Date(message.createdAt);
    if (isValidate(date)) {
      const dateString = format(date, "yyyy-MM-dd");
      if (!acc[dateString]) {
        acc[dateString] = [];

      }
      acc[dateString].push(message);

    } else {
      console.error("Invalid date for message", message)
    }
    return acc;
  }, {}

  ) : {};


  useEffect(() => {
  messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [groupedMessages]);


useEffect(() => {
  return () => {
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
  };
}, [filePreview]);

  // console.log("this is group message",groupedMessages);

  const handleReaction = (messageId, emoji) => {
    console.log(messageId,emoji)
    addReaction(messageId, emoji)
  }


const handleVideoCall = ()=>{
   if(selectedContact && online){
      const {initiateCall} = useVideoCallStore.getState();

      const avatar = selectedContact?.profilepicture;
      initiateCall(
        selectedContact?._id,
        selectedContact?.username,
        avatar,
        "video"
      )
   }else{
    alert("User is offline cannot initiate call")
   }
}
  

  if (!selectedContact) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center mx-auto h-screen text-center">
        <div className='max-w-md'>
          <img src={whatsapp_image}
            alt="chat-app"
            className='w-full h-auto'
          />
          <h2 className={`text-3xl font-semibold mb-4 ${theme === 'dark' ? "text-white" : "text-black"}`}>
            Select a conversation to start chating
          </h2>

          <p className={`${theme === 'dark' ? "text-gray-400" : "text-gray-600"} mb-6`}>
            Choose a contact from the list on the left to begin messaging
          </p>

          <p className={`${theme === 'dark' ? "text-gray-400" : "text-gray-600"} text-sm mt-8 flex items-center justify-center gap-2`}>
            <FaLock className='h-4 w-4' />
            Your personal messages are end to end encrypted
          </p>


        </div>



      </div>
    )
  }

  return (
    <>
    <div className='flex-1 h-screen w-full flex flex-col'>

      {/* 1.headre section of th ui profileimage and call icon in flex on the top */}
      <div className={`p-4 ${theme === 'dark' ? "bg-[#303430] text-white" : "bg-[rgb(239,242,245)] text-gray-600"} flex items-center`}>
        <button className='mr-2 focus:outline-none'
          onClick={() => setSelectedContact(null)}>
          <FaArrowLeft className="h-6 w-6" />
        </button>

        <img
          src={selectedContact?.profilepicture}
          alt={selectedContact?.username}
          className='w-10 h-10 rounded-full'
        />

        <div className='ml-3 flex-grow'>
          <h2 className='font-semibold text-start'>
            {selectedContact?.username}
          </h2>

          {isTyping ? (
            <div>Typing...</div>
          ) : (
            <p className={`text-sm ${theme === 'dark' ? "text-gray-400" : "text-gray-500"}`}>
              {online ? "online" : lastseen ? `Last seen ${format(new Date(lastseen), "HH:mm")}` : "Offline"}
            </p>
          )}

        </div>

        <div className='flex items-center space-x-4'>
          <button className='focus:outline-none'
           onClick={handleVideoCall}
           
          >

           <FaVideo className='h-5 w-5  text-green-500 hover:text-green-600'/>
          </button>

          <button className='focus:outline-none'>
            <FaEllipsisV className='h-5 w-5'/>
          </button>

        </div>

      </div>
      
     {/* 2. beech ka section jaha message show hoga */}
     
      <div
  className={`flex-1 p-4 overflow-y-auto space-y-2 ${
    theme === "dark" ? "bg-[#191a1a]" : "bg-[rgb(241,236,229)]"
  }`}
>
  {Object.entries(groupedMessages)
    .map(([date, msgs]) => {
      // FILTER FIRST (important)
      const filteredMsgs = msgs.filter(
        (msg) =>
          msg?.conversation?._id?.toString() ===
          selectedContact?.conversation?._id?.toString()
      );

      if (filteredMsgs.length === 0) return null;

      return (
        <React.Fragment key={date}>
          {renderDateSeparator(new Date(date))}

          {filteredMsgs.map((msg) => (
            <MessageBubble className='mr-0'
              key={msg._id || msg.tempId}
              message={msg}
              theme={theme}
              currentUser={user}
              onReact={handleReaction}
              deleteMessage={deleteMessage}
            />
          ))}
        </React.Fragment>
      );
    })}

  {/* AUTO SCROLL */}
  <div ref={messageEndRef} />
</div>

  {/* after selecting file file preview ui design */}
  {filePreview && (
    <div className='relative p-2'>
  {
    selectedFile?.type.startsWith("video/") ? (
   <video
    src={filePreview}
    controls
    className='w-80 object-cover rounded shadow-lg mx-auto'
   />
    ): (
<img src={filePreview} alt="file-preview"
        className='w-80 object-cover rounded shadow-lg mx-auto'
      />
    )
  }


      <button
        onClick={()=>{
          setSelectedFile(null);
          setFilePreview(null);
          
        }}
        className='absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1'
      >
        <FaTimes className='h-4 w-4 '/>
      </button>

    </div>

  )}

{/* //3.nichhek aui design area */}
  <div className={`p-4 ${theme === 'dark' ? "bg-[#303430]" : "bg-white"} flex items-center space-x-2 relative`}>
          
     <button 
      className='focus:outline-none'
       onClick={()=>setShowEmojipicker(!showEmojiPicker)}
     >
      <FaSmile 
       className={`h-6 w-6 ${theme === 'dark' ? "text-gray-400": "text-gray-500"}`}
      />
     </button>

     {showEmojiPicker && (
      <div ref={emojiPickerRef} className='absolute left-0 bottom-16 z-50'>
         <EmojiPicker 
         onEmojiClick={(emojiObject) => {
          setMessage((prev) => prev + emojiObject.emoji)
          setShowEmojipicker(false)
         }}
         theme={theme}
         />
      </div>
     ) }

     <div className='relative'>
      <button 
        className='focus:outline-none'
        onClick={()=>setShowFileMenu(!showFileMenu)}
        
      >
      <FaPaperclip  
        className={`h-6 w-6 ${theme === 'dark' ? "text-gray-400" : "text-gray-500"} mt-2`}
      />
      </button>

      {
        showFileMenu && (
          <div className={`absolute bottom-full left-0 mb-2 ${theme === 'dark' ? "bg-gray-700" : "bg-white"} rounded-lg shadow-lg`}>
           <input type="file" 
             ref={fileInputRef}
             onChange={handleFileChange}
             accept='image/*,video/*'
             className='hidden'
           />

          <button
          onClick={() => fileInputRef.current.click()}
          className={`flex items-center px-4 py-2 w-full transition-colors ${theme === 'dark' ? "hover:bg-gray-500": "hover:bg-gray-100"}`}
          >
            <FaImage className='mr-2'/>Image/video
          </button>

       <button
          onClick={() => fileInputRef.current.click()}
          className={`flex items-center px-4 py-2 w-full transition-colors ${theme === 'dark' ? "hover:bg-gray-500": "hover:bg-gray-100"}`}
          >
            <FaFile className='mr-2'/>Documents
          </button>

          </div>
        )
      }
     </div>

     <input type="text"
     value={message}
     onChange={(e)=>setMessage(e.target.value)}
     onKeyDown = {(e)=>{
      if(e.key === "Enter" && !e.shiftKey){
       
        handleSendMessage();
      } 
     }
    }
    placeholder='Type a message' 
  className={`flex-grow px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 ${theme === 'dark' ? "bg-gray-600 text-white border-gray-600" : "bg-white text-black border-gray-300"}`}
     />

     <button onClick={handleSendMessage} className='focus:outline-none'>
      <FaPaperPlane className='h-6 w-6 text-green-400'/>
     </button>

  </div>
    </div>

    <VideoCallManager socket={socket}/>

</>

  )
}
