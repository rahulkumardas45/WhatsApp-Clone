import React, { use, useEffect, useMemo, useRef } from 'react'
import useVideoCallStore from '../../store/videoCallStore';
import useUserStore from '../../store/useUserStore';
import useThemeStore from '../../store/themeStore';
import { FaMicrophone, FaMicrophoneSlash, FaPhoneSlash, FaTimes, FaVideo, FaVideoSlash } from 'react-icons/fa';

const VideoCallModal = ({ socket }) => {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const { currentCall,
        incomingCall,
        isCallActive,
        callType,
        localStream,
        remoteStream,
        isVideoEnabled,
        isAudioEnabled,
        peerConnection,
        iceCandidateQueue,
        isCallModalOpen,
        callStatus,
        setIncommingCall,
        setCallType,
        setCurrentCall,
        setCallModalOpen,
        setCallStatus,
        endCall,
        setCallActive,
        setLocalStream,
        setRemoteStream,
        setPeerConnection,
        addIceCandidate,
        processQueuedIceCandidates,
        toggleVideo,
        toggleAudio,
        clearIncomingCall
    } = useVideoCallStore();

    const { user } = useUserStore();
    const { theme } = useThemeStore();
    //rctc configuration
    const rtcConfiguration = {
        iceServers: [
            {
                urls: 'stun:stun.l.google.com:19302'
            },
            {
                urls: 'stun:stun1.l.google.com:19302'
            },
            {
                urls: 'stun:stun2.l.google.com:19302'
            },

        ],
    };

    // meorize display the user and it is prevent the unneccessary re-render
    const displayInfo = useMemo(() => {
        if (incomingCall && !isCallActive) {
            return {
                name: incomingCall.callerName,
                avatar: incomingCall.callerAvatar
            }
        } else if (currentCall) {
            return {
                name: currentCall.participantName,
                avatar: currentCall.participantAvatar
            }
        }
        return null;
    }, [incomingCall, currentCall, isCallActive])

    //connection detection
    useEffect(() => {
        if (peerConnection && remoteStream) {
            console.log("both user connection and remote stream is avaiable")
            setCallStatus("connected");
            setCallActive(true)
        }
    }, [peerConnection, remoteStream, setCallStatus, setCallActive])


    // setup the local stream when local stream is change
    useEffect(() => {
        if (localStream && localVideoRef.current) {
             console.log("Setting local video stream", localStream);
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream])


    //set up the remot evidoe strem when remote stream changes
    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {

            console.log("Setting remote video stream", remoteStream);

            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream])

    //Initialize media stream 

    const InitializeMedia = async (video = true) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: video ? { width: 640, height: 480 } : false,
                audio: true,
            })
            console.log("local meadia tsream ", stream.getTracks());

            setLocalStream(stream)
            return stream;

        } catch (error) {
            console.error("Media error", error)
            throw error;
        }

    };

    //create peer connection

    const createPeerConnection = (stream, role) => {
        const pc = new RTCPeerConnection(rtcConfiguration);
        //add local tracks immediatly
        if (stream) {
            stream.getTracks().forEach((track) => {
                pc.addTrack(track, stream)
            })
        }

        //handle ice candidate
   pc.onicecandidate = (event) => {
    if (event.candidate && socket) {
        const participantId =
            currentCall?.participantId || incomingCall?.callerId;

        const callId =
            currentCall?.callId || incomingCall?.callId;

        if (!participantId || !callId) return;

        socket.emit("webrtc_ice_candidate", {
            candidate: event.candidate,
            receiverId: participantId, 
            callId
        });
    }
};


        // pc.onicecandidate = (event) => {
        //     if (event.candidate && socket) {
        //         const participantId = currentCall?.participantId || incomingCall?.callerId;
        //         const callId = currentCall?.callId || incomingCall?.callId;

        //         if (participantId, callId) {
        //             socket.emit("webrtc_ice_candidate", {
        //                 candidate: event.candidate,
        //                 receiverId: event.participantId,
        //                 callId: callId
        //             })
        //         }
        //     }
        // }

        //handle remote stream

        pc.ontrack = (event) => {
            console.log(`${role} : Remote track received`, event);
            if (event.streams && event.streams[0]) {
                setRemoteStream(event.streams[0]);
            } else {
                const stream = new MediaStream([event.track]);
                setRemoteStream(stream)
            }
        }

        pc.onconnectionstatechange = () => {

            console.log(`role: ${role} : connection state`, pc.connectionState)


            if (pc.connectionState === "failed") {
                setCallStatus("failed")
                setTimeout(handleEndCall, 2000)
            }
        }


        pc.oniceconnectionstatechange = () => {
            console.log(`${role} : ICE state`, pc.iceConnectionState);
        }


        pc.onsignalingstatechange = () => {
            console.log(`${role} : Signaling state`, pc.signalingState)
        }

        setPeerConnection(pc);
        return pc;
    }


    //caller : initialize call after acceptance

    const InitializeCallerCall = async () => {
        try {
            setCallStatus("connecting");

            //get media
            const stream = await InitializeMedia(callType === 'video');
        console.log("Caller media stream obtained:", stream);
            //craete peer connection with offer
            const pc = createPeerConnection(stream, "CALLER");

            const offer = await pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: callType === "video"
            })

            await pc.setLocalDescription(offer)

            socket.emit("webrtc_offer", {
                offer,
                receiverId: currentCall?.participantId,
                callId: currentCall?.callId
            })

        } catch (error) {
            console.error("Caller Error", error)
            setCallStatus("failed")
            setTimeout(handleEndCall, 2000)

        }
    }


    //receiver : answer the calll

    const handleAnswerCall = async () => {
        try {
            setCallStatus("connecting");

            //get media
            const stream = await InitializeMedia(callType === 'video');

            //craete peer connection with offer
            const pc = createPeerConnection(stream, "RECEIVER");

            socket.emit("accept_call", {
                callerId: incomingCall?.callerId,
                callId: incomingCall?.callId,
                receiverInfo: {
                    username: user?.username,
                    profilepicture: user?.profilepicture
                }
            })

            setCurrentCall({
                callId: incomingCall?.callId,
                participantId: incomingCall?.callerId,
                participantName: incomingCall?.callerName,
                participantAvatar: incomingCall?.callerAvatar
            })
            clearIncomingCall();

        } catch (error) {
            console.error("Receiver Error:", error)
            handleEndCall();
        }
    }


    const handleRejectCall = () => {
        if (incomingCall) {
            socket.emit("reject_call", {
                callerId: incomingCall?.callerId,
                callId: incomingCall?.callId
            })
        }
        endCall();
    }





    const handleEndCall = () => {
        const participantId = currentCall?.participantId || incomingCall?.callerId;
        const callId = currentCall?.callId || incomingCall?.callId;

        if (participantId && callId) {
            socket.emit("end_call", {
                callId: callId,
                participantId: participantId
            })
        }

        endCall();

    }

    //socket event listeners

    useEffect(() => {
        if (!socket) return;

        //call accepted start caller flow
        const handleCallAccepted = ({receiverName}) => {
            if (currentCall) {
                setTimeout(() => {
                    InitializeCallerCall();
                }, 500);
            }
        }

        const handleCallRejected = () => {
            setCallStatus("rejected");
            setTimeout(endCall, 2000)
        }

        const handleCallEnded = () => {
            endCall();
        }


        const handleWebRTCOffer = async ({ offer, senderId, callId }) => {
            if (!peerConnection) {
                return;
            }

            try {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

                // process queued ice candidates
                await processQueuedIceCandidates();

                //create answer
                const answer = await peerConnection.createAnswer();
                 console.log("Receiver: Answer created", answer);
                await peerConnection.setLocalDescription(answer);
                //send answer back to caller
                socket.emit("webrtc_answer", {
                    answer,
                    receiverId: senderId,
                    callId
                })

                console.log("Receiver: Answer send waiting for ice candidates")

            } catch (error) {
                console.error("Receiver handling WebRTC offer:", error);
            }
        }


        //Receiver answer (caller)

        const handleWebRTCAnswer = async ({ answer, senderId, callId }) => {
            
            if (!peerConnection || peerConnection.signalingState === "closed") 
                {
                    return;
                }

                try {
                    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
                    await processQueuedIceCandidates();
                    //check receiver
                    const receivers = peerConnection.getReceivers();
                    console.log("caller: Peer connection established with receivers:", receivers);

                } catch (error) {
                    console.error("caller answer error", error)
                }

            

        }

        // This function runs on the CALLER side when the RECEIVER sends back their "answer"



        //Receiver ICE candidate

        const handleWebRTCIceCandidates = async ({candidate, senderId}) => {
            if (peerConnection && peerConnection.signalingState !== 'closed') {
                if (peerConnection.remoteDescription) {
                    try {
                        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                        console.log("ICE candiadate addeded directly")
                    } catch (error) {
                        console.error("Ice acndidate adding received ice candidate", error)
                    }
                } else {
                    addIceCandidate(candidate);
                    console.log("ICE candidate queued")
                }
            }

        }

        // Register all events listners

        socket.on("call_accepted", handleCallAccepted);
        socket.on("call_rejected", handleCallRejected);
        socket.on("call_ended", handleCallEnded);
        socket.on("webrtc_offer", handleWebRTCOffer);
        socket.on("webrtc_answer", handleWebRTCAnswer);
        socket.on("webrtc_ice_candidate", handleWebRTCIceCandidates);

        console.log("Socket event listeners registered");
        //cleanup on unmount
        return () => {
            
                socket.off("call_accepted", handleCallAccepted);
                socket.off("call_rejected", handleCallRejected);
                socket.off("call_ended", handleCallEnded);
                socket.off("webrtc_offer", handleWebRTCOffer);
                socket.off("webrtc_answer", handleWebRTCAnswer);
                socket.off("webrtc_ice_candidate", handleWebRTCIceCandidates);
            
        }


    }, [socket, peerConnection, currentCall, incomingCall, InitializeCallerCall, processQueuedIceCandidates, addIceCandidate, setCallStatus, endCall, setCurrentCall, clearIncomingCall, user])


    if (!isCallModalOpen && !incomingCall) return null;
    const shouldShowActiveCall = isCallActive || callStatus === "connecting" || callStatus === "calling";




    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75'>
            <div className={`relative w-full h-full max-w-4xl max-h-3xl rounded-lg overflow-hidden ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
                {/* //incoming calling ui */}

                {incomingCall && !isCallActive && (
                    <div className='flex flex-col items-center justify-center h-full p-8'>
                        <div className='text-center mb-8'>


                            <div className='w-32 h-32 rounded-full bg-gray-300 mx-auto mb-4 overflow-hidden'>
                                <img src={displayInfo?.avatar} alt={displayInfo?.name} className='w-full h-full object-cover' 
                                   onError={(e)=>{
                                    e.target.src = "/placeholder.svg"
                                   }}
                                />

                            </div>

                            <h2 className={`text-2xl font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{displayInfo?.name}</h2>
                            <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                Incoming{callType} call...
                            </p>

                        </div>
                        <div className='flex space-x-6'>
                            <button
                                onClick={handleRejectCall}
                                className='w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors'>
                                <FaPhoneSlash className='w-6 h-6' />
                            </button>

                            <button
                                onClick={handleAnswerCall}
                                className='w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white transition-colors'>
                                <FaVideo className='w-6 h-6' />
                            </button>

                        </div>

                    </div>
                )}

                {/* active call UI */}
                {shouldShowActiveCall && (
                    <div className='relative w-full h-full'>
                        {callType === 'video' && (
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                muted = {false}
                                className={`w-full h-full object-cover bg-gray-800 ${remoteStream ? "block" : "hidden"}`}
                            />
                        )}


                        {/* avatar /staatus display */}

                        {(!remoteStream && callType === 'video') && (
                            <div className='w-full h-full bg-gray-800 flex items-center justify-center'>
                                <div className='text-center'>
                                    <div className='w-32 h-32 rounded-full bg-gray-600 mx-auto mb-4 overflow-hidden'>
                                        <img src={displayInfo?.avatar} alt={displayInfo?.name} className='w-full h-full object-cover' 
                                        onError={(e)=>{
                                    e.target.src = "/placeholder.svg"
                                   }}
                                        />
                                    </div>
                                    <p>
                                        {
                                            callStatus === "calling" ? `calling ${displayInfo?.name}...` : callStatus === "connecting" ? `Connecting...` : callStatus === "connected" ? `Connected` : callStatus === "failed" ? `Call Failed` : displayInfo?.name
                                        }
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* local video preview */}

                        {callType === 'video' && localStream && (
                            <div className='absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white'>
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className={`w-full h-full object-cover bg-gray-800 ${localStream ? "block" : "hidden"}`}
                                />
                            </div>

                        )}

                        {/* /call status */}
                        <div className='absolute top-4 left-4'>
                            <div className={`px-4 py-2 rounded-full ${theme === 'dark' ? 'bg-gray-700 bg-opacity-75' : 'bg-white bg-opacity-75'} `}>
                                <p
                                    className={`text-sm ${theme === 'dark' ? "text-white" : "text-gray-900"}`}
                                >
                                    {callStatus === "connected" ? "Connected" : callStatus}
                                </p>
                            </div>
                        </div>


                        {/* //controls the call */}

                        <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2'>
                            <div className='flex space-x-4'>
                                {callType === 'video' && (
                                    <button 
                                        onClick={toggleVideo}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center  transition-colors ${isVideoEnabled ? 'bg-green-500 hover:bg-green-60 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
                                        {isVideoEnabled ? <FaVideo className='w-5 h-5 ' /> : <FaVideoSlash className='w-5 h-5' />}
                                    </button>
                                )}

                                <button 
                                 onClick={toggleAudio}
                                className={`w-12 h-12 rounded-full flex items-center justify-center  transition-colors ${isAudioEnabled ? 'bg-green-500 hover:bg-green-60 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
                                    {isAudioEnabled ? <FaMicrophone className='w-5 h-5 ' /> : <FaMicrophoneSlash className='w-5 h-5' />}
                                </button>


                                <button
                                    onClick={handleEndCall}
                                    className='w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors'>
                                    <FaPhoneSlash className='w-5 h-5' />
                                </button>

                            </div>
                        </div>

                    </div>
                )}

                {
                    callStatus === "calling" && (
                        <button
                            onClick={handleEndCall}
                            className='absolute top-4 right-4  w-8 h-8 bg-gray-500 hover:bg-gray-600 rounded-full flex items-center justify-center text-white transition-colors'>
                            <FaTimes className='w-5 h-5' />
                        </button>

                    )
                }



            </div>

        </div>
    )
}

export default VideoCallModal


