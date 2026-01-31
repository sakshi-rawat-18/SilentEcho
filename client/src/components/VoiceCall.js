import React, { useEffect, useState, useRef } from 'react';
import SimplePeer from 'simple-peer'; // You might need to run: npm install simple-peer
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
    // 1. Get Microphone Access
    navigator.mediaDevices.getUserMedia({ video: false, audio: true }).then((currentStream) => {
      setStream(currentStream);
      if (userVideo.current) userVideo.current.srcObject = currentStream;

      // 2. Initialize Peer Connection
      const peer = new SimplePeer({
        initiator: isInitiator,
        trickle: false,
        stream: currentStream,
      });

      // 3. LISTEN: When we generate a signal, save it to Firebase
      peer.on('signal', (data) => {
        const path = isInitiator ? 'offer' : 'answer';
        set(ref(db, `calls/${roomId}/${path}`), JSON.stringify(data));
      });

      // 4. CONNECT: When they send a signal, accept it
      peer.on('stream', (partnerStream) => {
        if (partnerVideo.current) partnerVideo.current.srcObject = partnerStream;
        setCallStatus("Connected");
        // Play audio
        const audio = new Audio();
        audio.srcObject = partnerStream;
        audio.play();
      });

      peerRef.current = peer;

      // 5. FIREBASE LISTENER: Watch for their signal
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
       // Cleanup on exit
       if(stream) stream.getTracks().forEach(track => track.stop());
       if(peerRef.current) peerRef.current.destroy();
       remove(ref(db, `calls/${roomId}`)); // Clear data
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
    <div className="voice-call-overlay">
        <div className="pulse-ring"></div>
        <div className="caller-avatar">
            <FaVolumeUp size={40} />
        </div>
        <h3>{callStatus}</h3>
        <p>{isMuted ? "You are muted" : "Speaking..."}</p>
        
        <div className="call-controls">
            <button onClick={toggleMute} className={`icon-btn ${isMuted ? 'muted' : ''}`}>
                {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
            </button>
            <button onClick={onClose} className="icon-btn hangup">
                <FaPhoneSlash />
            </button>
        </div>
        
        {/* Hidden Audio Elements */}
        <audio ref={userVideo} muted autoPlay />
        <audio ref={partnerVideo} autoPlay />
    </div>
  );
};

export default VoiceCall;