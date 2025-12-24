import React, { useEffect, useRef, useState } from 'react'
import useUserStore from '../../store/useUserStore';
import useThemeStore from '../../store/themeStore'
import { useChatStore } from '../../store/chatStore';

const isValidate = (date) => {
  return date instanceof Date && !isNaN(date)
}

export const ChatWindow = ({selectedContact,setSelectedContact}) => {

  const [message, setMessage] = useState("");
  const [showEmojiPicker, setEmojipicker] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const typingTimeoutRef = useRef(null);
  const messageEndRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const fileInputRef = useRef(null);


  const { theme } = useThemeStore();
  const { user } = useUserStore();


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
  const isTyping  = isUserTyping(selectedContact?._id);

  useEffect(() => {
    if(selectedContact?._id && conversations?.data?.length > 0){
      const conversation = conversations?.data?.find((conv) =>
      conv.participants.some((participant) => participant._id ===selectedContact?._id)
      )
      if(conversation._id){
        fetchMessage(conversation._id);
      }


    }
  },[selectedContact,conversations])


  useEffect(()=>{
    fetchConversations();
  },[]);

// scroll automatic me chat start

const scrollToBottom = () =>{
   messageEndRef.current?.scrollIntoView({behavior:"auto"})
}


useEffect(()=>{
  scrollToBottom();
},[messages])


useEffect(() => {
  if(message && selectedContact){
    startTyping(selectedContact?._id);
    if(typingTimeoutRef.current){
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(selectedContact?._id)
      
    }, 2000);
  }
  return () => {
    if(typingTimeoutRef.current){
      clearTimeout(typingTimeoutRef.current)
    }
  }

}, [message,selectedContact,startTyping,stopTyping])

const handleFileChange = (e) => {
  const file = e.target.files[0];
  if(file){
    setSelectedFile(file);
    setShowFileMenu(false);

    if(file.type.startsWith('image/')){
      setFilePreview(URL.createObjectURL(file))
    }

  }
}

// api cal for send the messsage data 
const handleSendMessage = async()=>{
  if(!selectedContact)  return ;
  setFilePreview(null);
  try {
    const formData = new FormData();
    formData.append("senderId", user?._id)
    formData.append("receiverId",selectedContact?._id)

    const status = online ? "delivered" : "send";
    formData.append("messageStatus",status);
    if(message.trim()){
      formData.append("content",message.trim());
    }
    // if there is file include to too
    if(selectedFile){
      formData.append("media",selectedFile,selectedFile.name)
    }

    if(!message.trim() && !selectedFile) return ;
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



  return (
    <div>ChatWindow</div>
  )
}
