import React, { useEffect, useState, useRef } from 'react';
import SimplePeer from 'simple-peer'; 
import { db } from '../firebaseConfig';
import { ref, onValue, set, remove, off } from "firebase/database";
import { FaMicrophone, FaMicrophoneSlash, FaPhoneSlash, FaVolumeUp } from 'react-icons/fa';
import '../App.css'; 

const VoiceCall = ({ roomId, isInitiator, myId, onClose }) => {
  const [stream, setStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callStatus, setCallStatus] = useState("Connecting...");
  const [seconds, setSeconds] = useState(0); // 🟢 Timer State
  
  const userVideo = useRef();
  const partnerVideo = useRef();
  const peerRef = useRef();

  // 🟢 TIMER LOGIC
  useEffect(() => {
    let interval = null;
    if (callStatus === "Connected") {
        interval = setInterval(() => {
            setSeconds(prev => prev + 1);
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  // Format time (e.g., 65s -> 01:05)
  const formatTime = (totalSeconds) => {
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;
    return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  useEffect(() => {
    let callRef = null;
    let callListener = null;

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
        // 🟢 SEND MY ID WITH THE SIGNAL
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

      peerRef.current = peer;

      // LISTEN FOR SIGNAL
      const partnerPath = isInitiator ? 'answer' : 'offer';
      callRef = ref(db, `calls/${roomId}/${partnerPath}`);

      callListener = onValue(callRef, (snapshot) => {
        const data = snapshot.val();
        if (data && !peer.destroyed) {
           // 🟢 PARSE THE NEW PAYLOAD FORMAT
           const parsed = JSON.parse(data);
           peer.signal(parsed.signal); 
        }
      });
    });

    return () => {
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
      await remove(ref(db, `calls/${roomId}`)); // 🟢 This kills the call for BOTH
      onClose(); 
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
        
        {/* 🟢 SHOW TIMER IF CONNECTED */}
        {callStatus === "Connected" && (
            <p style={{fontSize: '1.2rem', fontWeight: 'bold', color: '#4ade80', marginBottom:'10px'}}>
                {formatTime(seconds)}
            </p>
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