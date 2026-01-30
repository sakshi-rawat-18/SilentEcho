import React, { useEffect, useState, useRef } from 'react';
import Peer from 'simple-peer';
import { FaPhoneSlash, FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
import '../App.css'; // Make sure your CSS is imported

const VoiceCall = ({ socket, roomId, isInitiator, callerSignal, onClose }) => {
  const [stream, setStream] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: false, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        if (myVideo.current) myVideo.current.srcObject = currentStream;

        if (isInitiator) {
          // 🟢 INITIATOR: Create the peer and send signal to ROOM
          const peer = new Peer({ initiator: true, trickle: false, stream: currentStream });

          peer.on('signal', (data) => {
            // 🟢 CRITICAL FIX: Send 'roomId' so the server knows where to broadcast!
            socket.emit("call_user", {
                roomId: roomId, // <--- THIS WAS MISSING
                signalData: data,
                from: socket.id 
            });
          });

          peer.on('stream', (currentStream) => {
            if (userVideo.current) userVideo.current.srcObject = currentStream;
          });

          socket.on("call_accepted", (signal) => {
             setCallAccepted(true);
             peer.signal(signal);
          });

          connectionRef.current = peer;

        } else {
          // 🟢 RECEIVER: Answer the call
          const peer = new Peer({ initiator: false, trickle: false, stream: currentStream });

          peer.on('signal', (data) => {
            socket.emit("answer_call", { 
                signal: data, 
                roomId: roomId // <--- THIS WAS MISSING
            });
          });

          peer.on('stream', (currentStream) => {
            if (userVideo.current) userVideo.current.srcObject = currentStream;
          });

          // If we have an incoming signal, accept it
          if (callerSignal) {
              peer.signal(callerSignal);
          }
          
          connectionRef.current = peer;
        }
      });
      
      // Cleanup when component closes
      return () => {
          socket.off("call_accepted");
          if(connectionRef.current) connectionRef.current.destroy();
      };
      // eslint-disable-next-line
  }, []);

  const toggleMute = () => {
      if (stream) {
          stream.getAudioTracks()[0].enabled = !stream.getAudioTracks()[0].enabled;
          setIsMuted(!isMuted);
      }
  };

  return (
    <div className="video-container">
      <div className="video-box">
          {/* Audio elements are hidden but active */}
          <audio playsInline muted ref={myVideo} autoPlay />
          <audio playsInline ref={userVideo} autoPlay />
          
          <div className="call-animation">
             <div className="pulse-ring"></div>
             <div className="pulse-ring delay"></div>
             <div className="avatar-circle">
                {callAccepted ? "🗣️" : "📞"}
             </div>
          </div>

          <div className="call-status">
             {callAccepted ? "Connected" : "Calling..."}
          </div>

          <div className="call-controls">
            <button onClick={toggleMute} className={`control-btn ${isMuted ? 'muted' : ''}`}>
                {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
            </button>
            <button onClick={onClose} className="control-btn end-call">
                <FaPhoneSlash />
            </button>
          </div>
      </div>
    </div>
  );
};

export default VoiceCall;