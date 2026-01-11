

const handleVideoCallEvent = (socket,io,onlineUsers)=>{

    //initialize  video call

    socket.on("initiate_call",({callerId,receiverId,callType,callerInfo})=>{
           const receiverSocketId = onlineUsers.get(receiverId)
          
           if(receiverSocketId){
            const callId = `${callerId}-${receiverId}-${Date.now()}`;

            io.to(receiverSocketId).emit("incoming_call", {
                callerId,
                callerName:callerInfo.username,
                callerAvatar:callerInfo.profilepicture,
                callId,
                callType
            })
           }else{
            console.log(`server:Receiver ${receiverId}is offline`)
            socket.emit("call_failed", {reason:"user is offline"})
           }

        }
    )
           //accept call

    socket.on("accept_call",({callerId,callId,receiverInfo})=>{
           const callerSocketId = onlineUsers.get(callerId)
          
           if(callerSocketId){
           
            io.to(callerSocketId).emit("call_accepted", {
            
                callerName:receiverInfo.username,
                callerAvatar:receiverInfo.profilepicture,
                callId,
                
            })
           }else{
            console.log(`server:caller ${callerId}is not found`)
            
           }
        }
    )

          //reject the call

           socket.on("reject_call",({callerId,callId})=>{
           const callerSocketId = onlineUsers.get(callerId);
          
           if(callerSocketId){
           
            io.to(callerSocketId).emit("call_rejected", {
              callId
              
            })
        }

    });


    // call end

    socket.on("end_call", ({callId, participantId})=>{
        const participantSocketId = onlineUsers.get(participantId);

        if(participantSocketId){
            io.to(participantSocketId).emit("call_ended", {callId});
        }
    });

    // for the video feature we use webrtc 
// offer 
    socket.on("webrtc_offer", ({offer,receiverId,callId})=>{
      const receiverSocketId = onlineUsers.get(receiverId);
      if(receiverSocketId){
        io.to(receiverSocketId).emit("webrtc_offer", {
            offer,
            senderId:socket.userId,
            callId
        })
        console.log(`server offer forworded to ${receiverId}`)
      }else{
        console.log(`server: receiver ${receiverId} is not found offer`)
      }
    })
//answer webrrtc signalsevent with proper userid
    socket.on("webrtc_answer", ({answer,receiverId,callId})=>{
      const receiverSocketId = onlineUsers.get(receiverId);
      if(receiverSocketId){
        io.to(receiverSocketId).emit("webrtc_answer", {
            answer,
            senderId:socket.userId,
            callId
        })

        console.log(`server answer forworded to ${receiverId}`)
      }else{
     console.log(`server: receiver ${receiverId} is not found answer`) 
      }
    })

    socket.on("webrtc_answer", ({answer,receiverId,callId})=>{
      const receiverSocketId = onlineUsers.get(receiverId);
      if(receiverSocketId){
        io.to(receiverSocketId).emit("webrtc_answer", {
            answer,
            senderId:socket.userId,
            callId
        })

        console.log(`server answer forworded to ${receiverId}`)
      }else{
     console.log(`server: receiver ${receiverId} is not found answer`) 
      }
    })

    socket.on("webrtc_ice_candidate", ({candidate,receiverId,callId})=>{
        const receiverSocketId = onlineUsers.get(receiverId);

        if(receiverSocketId){
            io.to(receiverSocketId).emit("webrtc_answer",{
                candidate,
                senderId:socket.userId,
                callId
            })
        }else{
            console.log(`server: receiver ${receiverId} not found the ice candidate`)
        }
    })

};

module.exports = handleVideoCallEvent;
