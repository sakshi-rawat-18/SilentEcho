import React, { useEffect, useState, useRef } from 'react';
import SimplePeer from 'simple-peer'; 
import { db } from '../firebaseConfig';
import { ref, onValue, set, remove } from "firebase/database";
import { FaMicrophone, FaMicrophoneSlash, FaPhoneSlash, FaVolumeUp } from 'react-icons/fa';
import '../App.css'; 

const VoiceCall = ({ roomId, isInitiator, onClose }) => {
  const [stream, setStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callStatus, setCallStatus] = useState("Connecting...");
  const userVideo = useRef();
  const partnerVideo = useRef();
  const peerRef = useRef();

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: false, audio: true }).then((currentStream) => {
      setStream(currentStream);
      if (userVideo.current) userVideo.current.srcObject = currentStream;

      const peer = new SimplePeer({
        initiator: isInitiator,
        trickle: false,
        stream: currentStream,
      });

      peer.on('signal', (data) => {
        const path = isInitiator ? 'offer' : 'answer';
        set(ref(db, `calls/${roomId}/${path}`), JSON.stringify(data));
      });

      peer.on('stream', (partnerStream) => {
        if (partnerVideo.current) partnerVideo.current.srcObject = partnerStream;
        setCallStatus("Connected");
        const audio = new Audio();
        audio.srcObject = partnerStream;
        audio.play();
      });

      peerRef.current = peer;

      const partnerPath = isInitiator ? 'answer' : 'offer';
      const callRef = ref(db, `calls/${roomId}/${partnerPath}`);

      onValue(callRef, (snapshot) => {
        const data = snapshot.val();
        if (data && !peer.destroyed) {
           peer.signal(JSON.parse(data));
        }
      });
    });

    return () => {
       if(stream) stream.getTracks().forEach(track => track.stop());
       if(peerRef.current) peerRef.current.destroy();
    };
    // eslint-disable-next-line
  }, []);

  const toggleMute = () => {
    if (stream) {
        stream.getAudioTracks()[0].enabled = !stream.getAudioTracks()[0].enabled;
        setIsMuted(!isMuted);
    }
  };

  const endCall = async () => {
      // 🟢 CRITICAL: Delete call data so the other person knows to hang up
      await remove(ref(db, `calls/${roomId}`)); 
      onClose(); // Close my screen
  };

  // 🟢 NEW STYLES: Force Full Screen Overlay
  const overlayStyle = {
      position: 'fixed',
      top: 0, 
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #1f2937, #111827)',
      zIndex: 9999, // Ensure it sits on TOP of everything
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white'
  };

  return (
    <div style={overlayStyle}>
        <div className="pulse-ring"></div>
        
        <div className="caller-avatar" style={{marginBottom: '20px'}}>
            <FaVolumeUp size={50} color="#60a5fa" />
        </div>
        
        <h2 style={{marginBottom: '10px'}}>{callStatus}</h2>
        <p style={{color: '#9ca3af', marginBottom: '40px'}}>{isMuted ? "You are muted" : "Speaking..."}</p>
        
        <div className="call-controls" style={{display: 'flex', gap: '20px'}}>
            <button onClick={toggleMute} className={`icon-btn ${isMuted ? 'muted' : ''}`} style={btnStyle}>
                {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
            </button>
            
            <button onClick={endCall} className="icon-btn hangup" style={{...btnStyle, background: '#ef4444'}}>
                <FaPhoneSlash />
            </button>
        </div>
        
        {/* Hidden Audio Elements */}
        <audio ref={userVideo} muted autoPlay />
        <audio ref={partnerVideo} autoPlay />
    </div>
  );
};

const btnStyle = {
    padding: '20px',
    borderRadius: '50%',
    border: 'none',
    background: '#374151',
    color: 'white',
    fontSize: '1.5rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '70px',
    height: '70px',
    transition: 'all 0.2s'
};

export default VoiceCall;