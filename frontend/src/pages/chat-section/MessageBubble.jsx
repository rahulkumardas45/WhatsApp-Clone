import React, { useRef, useState } from 'react'

const MessageBubble = ({message,theme,onReact,currentUser,deleteMessage}) => {

    console.log("this is your message", message);

    const[showEmojiPicker,setShowEmojipicker] = useState(null);
    const[showReactions,setShowReactions] = useState(false);
    const messageRef = useRef(null)
    const [showOptions,setShowOptions] = useState(false);
    const optionRef = useRef(null);


    const emojiPickerRef = useRef(null)
    const reactionsMenuRef = useRef(null);

    

    const isUserMessage = message?.sender?._id === currentUser?._id; 
     
   


      const bubbleClass = isUserMessage ? 'chat-end':'chat-start'

    const bubbleContentClass = isUserMessage ? `chat-bubble md:max-w-[50%] min-w-[130px] ${
      theme === 'dark' ? "bg-[#144d38] text-white ": "bg-[#d9fdd3] text-black"
    }`
    :
    `chat-bubble md:max-w-[50%] min-w-[130px] ${
      theme === 'dark' ? "bg-[#144d38] text-white ": "bg-[#d9fdd3] text-black"
    }`;

  const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  const handleReact = (emoji)=>{
  onReact(message._id,emoji);
  setShowEmojipicker(false)
  setShowReactions(false)
  }

if (!message) return null;


  return (
     <div className={`chat ${bubbleClass}`}>
       <div className={`${bubbleContentClass} relative `} 
        ref={messageRef}
       >
        <div className='flex justify-center gap-2'>
  {message.contentType === 'text' && <p className='mr-2'>{message.content}</p>}
        </div>
       </div>

     </div>
  )
}

export default MessageBubble