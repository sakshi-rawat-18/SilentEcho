import React, { useEffect, useState, useRef } from 'react';
import Peer from 'peerjs';
import { FaPhoneSlash, FaMicrophone, FaMicrophoneSlash, FaVolumeUp } from 'react-icons/fa';

const VoiceCall = ({ socket, roomId, onClose, isInitiator, callerSignal }) => {
  // 🟢 REMOVED unused 'peerId' state to fix the warning
  const [callStatus, setCallStatus] = useState(isInitiator ? 'Calling...' : 'Connecting...');
  const [isMuted, setIsMuted] = useState(false);
  
  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const peerInstance = useRef(null);
  const myStreamRef = useRef(null);

  useEffect(() => {
    const startCall = async () => {
      try {
        // 1. Get Microphone Access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        myStreamRef.current = stream;
        
        if (localAudioRef.current) {
          localAudioRef.current.srcObject = stream;
        }

        // 2. Initialize Peer
        const peer = new Peer();
        peerInstance.current = peer;

        peer.on('open', (id) => {
          // We don't need to save peerId to state since we use 'id' directly here
          if (isInitiator) {
            // I am calling -> Send my ID to the partner
            socket.emit("call_user", { roomId, signal: id });
          } else if (callerSignal) {
            // I am answering -> Call the Initiator immediately!
            console.log("📞 Answering call from:", callerSignal);
            const call = peer.call(callerSignal, stream);
            
            call.on('stream', (userVideoStream) => {
              if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = userVideoStream;
                remoteAudioRef.current.play();
              }
              setCallStatus("Connected 00:01");
            });
          }
        });

        // 3. Handle Incoming Connection (For the Initiator)
        peer.on('call', (call) => {
          console.log("📞 Someone is connecting to me...");
          call.answer(stream); // Answer with my stream
          call.on('stream', (userVideoStream) => {
            if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = userVideoStream;
              remoteAudioRef.current.play(); 
            }
            setCallStatus("Connected 00:01");
          });
        });

      } catch (err) {
        console.error("Microphone error:", err);
        setCallStatus("Error: No Microphone Found");
      }
    };

    startCall();

    return () => {
      if (peerInstance.current) peerInstance.current.destroy();
      if (myStreamRef.current) myStreamRef.current.getTracks().forEach(track => track.stop());
    };
    // eslint-disable-next-line
  }, [roomId, isInitiator, callerSignal]); // Removed socket from dependency to prevent re-loops

  const toggleMute = () => {
    if (myStreamRef.current) {
      const audioTrack = myStreamRef.current.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  return (
    <div className="voice-modal-overlay">
      <div className="voice-card">
        <div className="caller-icon-large">
           <FaVolumeUp className="pulse-ring" />
        </div>
        
        <h3>{callStatus}</h3>
        <p>Silent Echo Secure Line</p>

        {/* Hidden Audio Elements */}
        <audio ref={localAudioRef} muted autoPlay /> 
        <audio ref={remoteAudioRef} autoPlay />

        <div className="call-controls">
          <button className={`control-btn ${isMuted ? 'muted' : ''}`} onClick={toggleMute}>
            {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
          </button>
          
          <button className="control-btn hangup" onClick={onClose}>
            <FaPhoneSlash />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceCall;