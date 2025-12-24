import { create } from "zustand";

import { getSocket } from "../Services/chatServices";
import axiosInstance from "../Services/url.services"




export const useChatStore = create(
   (set, get) => (
      {
         conversations: [],
         currentConversation: null,
         messages: [],
         loading: false,
         error: null,
         onlineUsers: new Map(),
         typingUsers: new Map(),




         // socket event listners setup
         initsocketListners: () => {
            const socket = getSocket();
            if (!socket) return;

            //remove exiting listerners to prevent duplicate handlers
            socket.off("receive_message");
            socket.off("user_typing");
            socket.off("user_status");
            socket.off("message_send");
            socket.off("message_error");
            socket.off("message_deleted");


            //listen for the incoming messages
            socket.on("receive_message", (message) => {



            })

            //conform deleviry of the message 
            socket.on("message_send", (message) => {
               set((state) => ({
                  messages: state.messages.map((msg) => msg._id === message._id ? { ...msg } : msg)
               }))

            });



            //update message status

            socket.on("message_status_update", ({ messageId, messageStatus }) => {
               set((state) => ({
                  messages: state.messages.map((msg) => msg._id === messageId ? { ...msg, messageStatus } : msg)
               }))

            });

            //handle reaction on message

            socket.on("reaction_update", ({ messageId, reactions }) => {
               set((state) => ({
                  messages: state.messages.map((msg) => msg._id === messageId ? { ...msg, reactions } : msg)
               }))
            })


            // handle delete message of the real time from local state

            socket.on("message_deleted", ({ deletedMessageId }) => {
               set((state) => ({
                  messages: state.messages.filter((msg) => msg._id !== deletedMessageId)
               }))
            })


            //handle any message sending error
            socket.on("message_error", (error) => {
               console.error("message error", error)
            })


            //listener for the user typing users
            socket.on("user_typing", ({ userId, conversationId, isTyping }) => {
               set((state) => {
                  const newTypingUsers = new Map(state.typingUsers);
                  if (!newTypingUsers.has(conversationId)) {
                     newTypingUsers.set(conversationId, new Set());
                  }

                  const typingSet = newTypingUsers.get(conversationId);
                  if (isTyping) {
                     typingSet.add(userId);
                  } else {
                     typingSet.delete(userId);
                  }

                  return { typingUsers: newTypingUsers }

               })
            });


            // treack the live online offline status of the users

            socket.on("user_status", ({ userId, isOnline, lastSeen }) => {
               set((state) => {
                  const newOnlineUsers = new Map(state.onlineUsers);
                  newOnlineUsers.set(userId, { isOnline, lastSeen });
                  return { onlineUsers: newOnlineUsers }
               })

            });


            // emit status check for all users in conversation list

            const { conversations } = get();
            if (conversations?.data?.length > 0) {
               conversations?.data?.array.forEach((conv) => {
                  const otherUser = conv.participants.find(
                     (p) => p._id !== get().currentUser._id
                  );
                  if (otherUser._id) {
                     socket.emit("get_user_status", otherUser._id, (status) => {
                        set((state) => {
                           const newOnlineUsers = new Map(state.onlineUsers);
                           newOnlineUsers.set(state.userId, {
                              isOnline: state.isOnline,
                              lastSeen: state.lastSeen
                           });
                           return { onlineUsers: newOnlineUsers }
                        })
                     })
                  }
               });
            }



         },

         setCurrentUser: (user) => set({ currentUser: user }),

         fetchConversations: async () => {
            set({ loading: true, error: null });
            try {
               const { data } = await axiosInstance.get("/chats/conversations");
               set({ conversations: data, loading: false }),

                  get().initsocketListners();
               return data;

            } catch (error) {
               set({
                  error: error?.response?.data?.message || error?.message,
                  loading: false
               });

               return null;

            }
         },


         // fetch message for a conversations

         fetchMessage: async (conversationId) => {
            if (!conversationId) return;

            set({ loading: true, error: null })
            try {
               const { data } = await axiosInstance.get(`/chats/conversations/${conversationId}/messages`);


               const messageArray = data.data || data || [];
               set({
                  messages: messageArray,
                  currentConversation: conversationId,
                  loading: false
               })

               //mark as un read message sle un read
               const { markMessageAsRead } = get();
               markMessageAsRead();


               return messageArray;

            } catch (error) {

               set({
                  error: error?.response?.data?.message || error?.message,
                  loading: false
               });

               return [];

            }
         },

         // send to real time message 

         sendMessage: async (formData) => {
             const senderId = formData.get("senderId");
             const receiverId = formData.get("receiverId");
             const media = formData.get("media");
             const content = formData.get("content");
             const messageStatus = formData.get("messageStaus");


             const socket = getSocket();
             

         },


         //receive message 
         receiveMessage: (message) => {
            if (!message) return;

            const { currentConversation, currentUser, messages } = get();

            const messageExits = message.some((msg) => msg._id === message._id);

            if (messageExits) return;

            if (message.conversation === currentConversation) {
               set((state) => (
                  {
                     messages: [...state.messages, message]
                  }
               ))


               //automatically mark as read 
               if (message.receiver?._id === currentUser?._id) {
                  get().markMessageAsRead();
               }


            }



            //update conversation preview and unread count

            set((state) => {
               const updateConversations = state.conversations?.data?.map((conv) => {
                  if (conv._id === message.conversation) {
                     return {
                        ...conv,
                        lastMessage: message,
                        unreadCount: message?.receiver?._id === currentUser?._id ?
                           (conv.unreadCount || 0) + 1 : conv.unreadCount || 0

                     }

                  }
                  return conv;
               })


               return {
                  conversations: {
                     ...state.conversations,
                     data: updateConversations,
                  },
               }

            })

         },


         // mark as read

         markMessageAsRead: async () => {
            const { messages, currentUser } = get();

            if (!messages.length || !currentUser) return;

            const unreadIds = messages.filter((msg) => msg.messageStatus !== 'read' && msg.receiver?._id === currentUser?._id).map((msg) => msg._id).filter(Boolean);

            if (unreadIds.length === 0) return;

            try {
               const { data } = await axiosInstance.put("/chats/messages/read", {
                  messageId: unreadIds
               });

               console.log('message mark as read', data)

               set((state) => ({
                  messages: state.messages.map((msg) =>
                     unreadIds.includes(msg._id) ? { ...msg, messageStatus: "read" } : msg
                  )
               }));


               const socket = getSocket();
               if (socket) {
                  socket.emit("message_read", {
                     messageIds: unreadIds,
                     senderId: messages[0]?.sender?._id
                  })
               }




            } catch (error) {

               console.error("failed to mark message as read", error)

            }


         },



         deleteMessage: async (messageId) => {

            try {
               await axiosInstance.delete(`/chats/messages/${messageId}`);
               set((state) => ({
                  messages: state.messages?.filter((msg) => msg?._id !== messageId)
               }))

               return true;

            } catch (error) {

               console.log("error deleting message", error)
               set({
                  error: error.response?.data?.message || error.message
               })

               return false;

            }
         },

         // add /change reactions

         addReaction: async (messageId, emoji) => {
            const socket = getSocket();
            const { currentUser } = get();

            if (socket && currentUser) {
               socket.emit("add_reaction", {
                  messageId,
                  emoji,
                  userId: currentUser?._id
               })

            }
         },

         // start and stop typing 
         startTyping: async (receiverId) => {
            const { currentConversation } = get();
            const socket = getSocket();
            if (socket && currentConversation && receiverId) {
               socket.emit("typing_start", {
                  conversationId: currentConversation,
                  receiverId
               })
            }

         },


         // start and stop typing 
         stopTyping: async (receiverId) => {
            const { currentConversation } = get();
            const socket = getSocket();
            if (socket && currentConversation && receiverId) {
               socket.emit("typing_stop", {
                  conversationId: currentConversation,
                  receiverId
               })
            }

         },

         isUserTyping: (userId) => {
            const { typingUsers, currentConversation } = get();
            if (!currentConversation || !typingUsers.has(currentConversation) || !userId) {
               return false;
            }

            return typingUsers.get(currentConversation).has(userId)
         },

         isUserOnline: (userId) => {
            if (!userId) return null;
            const { onlineUsers } = get();
            return onlineUsers.get(userId)?.isOnline || false;

         },

         getUserLastSeen: (userId) => {
            if (!userId) return null;
            const { onlineUsers } = get();
            return onlineUsers.get(userId)?.lastSeen || null;

         },

         cleanup: () => {
            set({
               conversations: [],
               currentConversation: null,
               messages: [],
               onlineUsers: new Map(),
               typingUsers: new Map(),
            })
         }







      }
   )
)