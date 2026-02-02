import React, { useEffect, useState, useRef } from 'react';
import SimplePeer from 'simple-peer'; 
import { db } from '../firebaseConfig';
import { ref, onValue, set, remove, off } from "firebase/database";
import { FaMicrophone, FaMicrophoneSlash, FaPhoneSlash, FaVolumeUp } from 'react-icons/fa';
import '../App.css'; 

const VoiceCall = ({ roomId, isInitiator, myId, onCallEnded }) => {
  const [stream, setStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callStatus, setCallStatus] = useState("Connecting...");
  const [seconds, setSeconds] = useState(0); 
  
  const userVideo = useRef();
  const partnerVideo = useRef();
  const peerRef = useRef();

  // TIMER LOGIC
  useEffect(() => {
    let interval = null;
    if (callStatus === "Connected") {
        interval = setInterval(() => {
            setSeconds(prev => prev + 1);
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  const formatTime = (totalSeconds) => {
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;
    return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  useEffect(() => {
    let callRef = null;
    let callListener = null;

    // 🔥 FIX 1: Added echoCancellation and noiseSuppression
    navigator.mediaDevices.getUserMedia({ 
        video: false, 
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false 
        } 
    }).then((currentStream) => {
      setStream(currentStream);
      if (userVideo.current) userVideo.current.srcObject = currentStream;

      const peer = new SimplePeer({
        initiator: isInitiator,
        trickle: false,
        stream: currentStream,
      });

      peer.on('signal', (data) => {
        const path = isInitiator ? 'offer' : 'answer';
        const payload = { signal: data, from: myId }; 
        set(ref(db, `calls/${roomId}/${path}`), JSON.stringify(payload));
      });

      peer.on('stream', (partnerStream) => {
        if (partnerVideo.current) partnerVideo.current.srcObject = partnerStream;
        setCallStatus("Connected"); 
        const audio = new Audio();
        audio.srcObject = partnerStream;
        audio.play();
      });

      peer.on('connect', () => {
        setCallStatus("Connected");
      });

      peerRef.current = peer;

      const partnerPath = isInitiator ? 'answer' : 'offer';
      callRef = ref(db, `calls/${roomId}/${partnerPath}`);

      callListener = onValue(callRef, (snapshot) => {
        const data = snapshot.val();
        if (data && !peer.destroyed) {
           const parsed = JSON.parse(data);
           peer.signal(parsed.signal); 
        }
      });
    });

    return () => {
       // Cleanup logic
       if(stream) stream.getTracks().forEach(track => track.stop());
       if(peerRef.current) peerRef.current.destroy();
       if(callRef && callListener) off(callRef, callListener);
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
      
      if (stream) {
          stream.getTracks().forEach(track => track.stop());
      }
      
      await remove(ref(db, `calls/${roomId}`)); 
      onCallEnded(formatTime(seconds)); 
  };

  const overlayStyle = {
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'linear-gradient(135deg, #1f2937, #111827)', zIndex: 10000,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white'
  };

  return (
    <div style={overlayStyle}>
        <div className="pulse-ring"></div>
        <div className="caller-avatar" style={{marginBottom: '20px'}}>
            <FaVolumeUp size={50} color="#60a5fa" />
        </div>
        
        <h2 style={{marginBottom: '5px'}}>{callStatus}</h2>
        
        {callStatus === "Connected" && (
            <div style={{
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: '#4ade80', 
                marginBottom:'10px',
                background: 'rgba(0,0,0,0.3)',
                padding: '5px 15px',
                borderRadius: '10px'
            }}>
                {formatTime(seconds)}
            </div>
        )}

        <p style={{color: '#9ca3af', marginBottom: '40px'}}>{isMuted ? "You are muted" : "Speaking..."}</p>
        
        <div className="call-controls" style={{display: 'flex', gap: '20px'}}>
            <button onClick={toggleMute} className={`icon-btn ${isMuted ? 'muted' : ''}`} style={btnStyle}>
                {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
            </button>
            <button onClick={endCall} className="icon-btn hangup" style={{...btnStyle, background: '#ef4444'}}>
                <FaPhoneSlash />
            </button>
        </div>
        <audio ref={userVideo} muted autoPlay />
        <audio ref={partnerVideo} autoPlay />
    </div>
  );
};

const btnStyle = {
    padding: '20px', borderRadius: '50%', border: 'none', background: '#374151', color: 'white',
    fontSize: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '70px', height: '70px', transition: 'all 0.2s'
};

export default VoiceCall;