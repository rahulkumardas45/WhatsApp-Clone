import React, { useRef, useState } from 'react'
import { format } from 'date-fns'
import {
  FaCheck,
  FaCheckDouble,
  FaPlus,
  FaRegCopy,
  FaSmile
} from 'react-icons/fa';
import { HiDotsVertical } from "react-icons/hi"
import useOutsideclick from '../../Hooks/useOutSideClick';
import EmojiPicker from 'emoji-picker-react';
import { RxCross2 } from "react-icons/rx"


const MessageBubble = ({
  message,
  theme,
  onReact,
  currentUser,
  deleteMessage
}) => {


  const [showEmojiPicker, setShowEmojipicker] = useState(null);
  const [showReactions, setShowReactions] = useState(false);
  const messageRef = useRef(null)
  const [showOptions, setShowOptions] = useState(false);
  const optionRef = useRef(null);


  const emojiPickerRef = useRef(null)
  const reactionsMenuRef = useRef(null);


  const isUserMessage =
    message?.sender?._id === currentUser?._id;


  console.log(
    "Message Data:",
    message.contentType,
    message.imageOrVideoUrl
  );


  const bubbleClass = isUserMessage
    ? 'chat-end'
    : 'chat-start'


  const bubbleContentClass = isUserMessage
    ? `
      relative
      group
      w-fit
      max-w-[85%]
      sm:max-w-[75%]
      md:max-w-[65%]
      lg:max-w-[55%]
      min-w-[90px]
      rounded-2xl
      rounded-br-md
      px-3
      py-2
      shadow-sm
      transition-all
      duration-200
      ${
        theme === 'dark'
          ? 'bg-[#005c4b] text-white'
          : 'bg-[#d9fdd3] text-gray-900'
      }
    `
    :
    `
      relative
      group
      w-fit
      max-w-[85%]
      sm:max-w-[75%]
      md:max-w-[65%]
      lg:max-w-[55%]
      min-w-[90px]
      rounded-2xl
      rounded-bl-md
      px-3
      py-2
      shadow-sm
      transition-all
      duration-200
      ${
        theme === 'dark'
          ? 'bg-[#202c33] text-white'
          : 'bg-white text-gray-900'
      }
    `;


  const quickReactions = [
    "👍",
    "❤️",
    "😂",
    "😮",
    "😢",
    "🙏"
  ];


  const handleReact = (emoji) => {
    onReact(message._id, emoji)
    setShowEmojipicker(false)
    setShowReactions(false)
    setShowOptions(false)
  };


  useOutsideclick(emojiPickerRef, () => {
    if (showEmojiPicker)
      setShowEmojipicker(false)
  })


  useOutsideclick(reactionsMenuRef, () => {
    if (showReactions)
      setShowReactions(false)
  })


  useOutsideclick(optionRef, () => {
    if (showOptions)
      setShowOptions(false)
  })


  if (!message) return null;


  return (
    <div
      className={`
        chat
        ${bubbleClass}
        mb-1
        px-2
        sm:px-3
      `}
    >

      <div
        className={bubbleContentClass}
        ref={messageRef}
      >

        {/* ================= MESSAGE CONTENT ================= */}

        <div className="flex flex-col">

          {/* TEXT MESSAGE */}

          {message.contentType === 'text' && (
            <div className="flex items-end gap-2">

              <p
                className="
                  whitespace-pre-wrap
                  break-words
                  text-[14px]
                  sm:text-[15px]
                  leading-[1.35]
                  pr-1
                "
              >
                {message.content}
              </p>

            </div>
          )}


          {/* IMAGE MESSAGE */}

          {message.contentType === 'image' && (
            <div className="flex flex-col">

              <div className="overflow-hidden rounded-xl">

                <img
                  src={
                    message.imageOrvideoUrl ||
                    message.imageOrVideoUrl
                  }
                  alt="imageurl"
                  className="
                    block
                    w-full
                    max-w-[280px]
                    sm:max-w-[350px]
                    max-h-[400px]
                    object-cover
                    cursor-pointer
                    transition-transform
                    duration-200
                    hover:scale-[1.02]
                  "
                />

              </div>

              {message.content && (
                <p
                  className="
                    mt-2
                    whitespace-pre-wrap
                    break-words
                    text-[14px]
                    leading-[1.35]
                  "
                >
                  {message.content}
                </p>
              )}

            </div>
          )}


          {/* VIDEO MESSAGE */}

          {message.contentType === 'video' && (
            <div className="flex flex-col">

              <div className="overflow-hidden rounded-xl">

                <video
                  src={message.imageOrVideoUrl}
                  controls
                  className="
                    block
                    w-full
                    max-w-[320px]
                    sm:max-w-[400px]
                    max-h-[400px]
                    rounded-xl
                    bg-black
                  "
                />

              </div>

              {message.content && (
                <p
                  className="
                    mt-2
                    whitespace-pre-wrap
                    break-words
                    text-[14px]
                    leading-[1.35]
                  "
                >
                  {message.content}
                </p>
              )}

            </div>
          )}

        </div>


        {/* ================= TIME + STATUS ================= */}

        <div
          className="
            flex
            items-center
            justify-end
            gap-1
            mt-1
            select-none
          "
        >

          <span
            className={`
              text-[10px]
              sm:text-[11px]
              ${
                theme === 'dark'
                  ? 'text-gray-300'
                  : 'text-gray-500'
              }
            `}
          >
            {format(
              new Date(message.createdAt),
              "HH:mm"
            )}
          </span>


          {isUserMessage && (
            <>

              {message.messageStatus === "send" && (
                <FaCheck
                  size={11}
                  className={
                    theme === 'dark'
                      ? 'text-gray-300'
                      : 'text-gray-500'
                  }
                />
              )}


              {message.messageStatus === "delivered" && (
                <FaCheckDouble
                  size={11}
                  className={
                    theme === 'dark'
                      ? 'text-gray-300'
                      : 'text-gray-500'
                  }
                />
              )}


              {message.messageStatus === "read" && (
                <FaCheckDouble
                  size={11}
                  className="text-[#53bdeb]"
                />
              )}

            </>
          )}

        </div>


        {/* ================= THREE DOT MENU BUTTON ================= */}

        <div
          className="
            absolute
            top-1
            right-1
            opacity-0
            group-hover:opacity-100
            transition-opacity
            duration-200
            z-20
          "
        >

          <button
            onClick={() =>
              setShowOptions((prev) => !prev)
            }
            className={`
              p-1.5
              rounded-full
              backdrop-blur-sm
              transition-all
              duration-150
              ${
                theme === 'dark'
                  ? 'text-gray-200 hover:bg-black/20'
                  : 'text-gray-700 hover:bg-black/10'
              }
            `}
          >

            <HiDotsVertical size={17} />

          </button>

        </div>


        {/* ================= REACTION BUTTON ================= */}

        <div
          className={`
            absolute
            ${isUserMessage ? "-left-11" : "-right-11"}
            top-1/2
            -translate-y-1/2
            opacity-0
            group-hover:opacity-100
            transition-all
            duration-200
            flex
            items-center
            z-20
          `}
        >

          <button
            onClick={() =>
              setShowReactions(!showReactions)
            }
            className={`
              p-2
              rounded-full
              shadow-md
              transition-all
              duration-200
              hover:scale-110
              ${
                theme === 'dark'
                  ? 'bg-[#202c33] hover:bg-[#2a3942]'
                  : 'bg-white hover:bg-gray-100'
              }
            `}
          >

            <FaSmile
              size={16}
              className={
                theme === 'dark'
                  ? 'text-gray-300'
                  : 'text-gray-600'
              }
            />

          </button>

        </div>


        {/* ================= QUICK REACTIONS ================= */}

        {showReactions && (
          <div
            ref={reactionsMenuRef}
            className={`
              absolute
              ${
                isUserMessage
                  ? "right-0"
                  : "left-0"
              }
              -top-12
              z-[60]
              flex
              items-center
              gap-1
              rounded-full
              px-2
              py-1.5
              shadow-xl
              border
              backdrop-blur-md
              ${
                theme === 'dark'
                  ? 'bg-[#202c33]/95 border-[#3b4a54]'
                  : 'bg-white/95 border-gray-200'
              }
            `}
          >

            {quickReactions.map(
              (emoji, index) => (

                <button
                  key={index}
                  onClick={() =>
                    handleReact(emoji)
                  }
                  className="
                    flex
                    items-center
                    justify-center
                    w-8
                    h-8
                    rounded-full
                    text-lg
                    hover:bg-gray-500/20
                    hover:scale-125
                    transition-all
                    duration-150
                  "
                >
                  {emoji}
                </button>

              )
            )}


            <div
              className={`
                w-px
                h-5
                mx-1
                ${
                  theme === 'dark'
                    ? 'bg-gray-600'
                    : 'bg-gray-300'
                }
              `}
            />


            <button
              className="
                flex
                items-center
                justify-center
                w-8
                h-8
                rounded-full
                hover:bg-gray-500/20
                transition-all
                duration-150
              "
              onClick={() =>
                setShowEmojipicker(true)
              }
            >

              <FaPlus
                className="
                  h-4
                  w-4
                  text-gray-400
                "
              />

            </button>

          </div>
        )}


        {/* ================= EMOJI PICKER ================= */}

        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className={`
              absolute
              z-[70]
              ${
                isUserMessage
                  ? "right-0"
                  : "left-0"
              }
              bottom-full
              mb-2
            `}
          >

            <div className="relative">

              <EmojiPicker
                onEmojiClick={(emojiObject) =>
                  handleReact(
                    emojiObject.emoji
                  )
                }
                theme={theme}
              />


              <button
                onClick={() =>
                  setShowEmojipicker(false)
                }
                className="
                  absolute
                  top-2
                  right-2
                  flex
                  items-center
                  justify-center
                  w-7
                  h-7
                  rounded-full
                  bg-black/10
                  hover:bg-black/20
                  text-gray-500
                  transition
                "
              >

                <RxCross2 size={17} />

              </button>

            </div>

          </div>
        )}


        {/* ================= REACTION DISPLAY ================= */}

        {message.reactions &&
          message.reactions.length > 0 && (

            <div
              className={`
                absolute
                -bottom-4
                ${
                  isUserMessage
                    ? "right-2"
                    : "left-2"
                }
                flex
                items-center
                gap-0.5
                rounded-full
                px-2
                py-0.5
                min-h-[25px]
                shadow-md
                border
                z-30
                ${
                  theme === 'dark'
                    ? 'bg-[#2a3942] border-[#3b4a54]'
                    : 'bg-white border-gray-200'
                }
              `}
            >

              {message.reactions.map(
                (reaction, index) => (

                  <span
                    key={index}
                    className="
                      text-sm
                      leading-none
                      hover:scale-125
                      transition-transform
                    "
                  >
                    {reaction.emoji}
                  </span>

                )
              )}

            </div>

          )}


        {/* ================= OPTIONS MENU ================= */}

        {showOptions && (
          <div
            ref={optionRef}
            className={`
              absolute
              top-8
              ${
                isUserMessage
                  ? "right-1"
                  : "left-1"
              }
              z-[80]
              w-36
              overflow-hidden
              rounded-xl
              shadow-2xl
              border
              py-1
              text-sm
              backdrop-blur-md
              ${
                theme === 'dark'
                  ? 'bg-[#233138]/95 border-[#3b4a54] text-white'
                  : 'bg-white/95 border-gray-200 text-gray-800'
              }
            `}
          >

            {/* COPY */}

            <button
              onClick={() => {

                if(message.contentType === 'text'){
                  navigator.clipboard.writeText(
                    message.content
                  )
                }

                setShowOptions(false)

              }}

              className={`
                flex
                items-center
                w-full
                px-4
                py-2.5
                gap-3
                transition-colors
                ${
                  theme === 'dark'
                    ? 'hover:bg-[#2a3942]'
                    : 'hover:bg-gray-100'
                }
              `}
            >

              <FaRegCopy size={14} />

              <span>
                Copy
              </span>

            </button>


            {/* DELETE */}

            {isUserMessage && (
              <button
                onClick={() => {

                  deleteMessage(
                    message._id
                  )

                  setShowOptions(false)

                }}

                className="
                  flex
                  items-center
                  w-full
                  px-4
                  py-2.5
                  gap-3
                  text-red-600
                  hover:bg-red-500/10
                  transition-colors
                "
              >

                <FaRegCopy
                  className="text-red-600"
                  size={14}
                />

                <span>
                  Delete
                </span>

              </button>
            )}

          </div>
        )}

      </div>

    </div>
  )
}

export default MessageBubble