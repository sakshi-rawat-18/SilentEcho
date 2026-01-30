import React, { useEffect, useState, useRef } from 'react';
import { FaUserSecret, FaPaperPlane, FaSignOutAlt, FaPhoneAlt, FaCircle } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import CrisisModal from './CrisisModal'; 
import VoiceCall from './VoiceCall'; 
import { encryptMessage, decryptMessage } from '../utils/encryption';
import '../App.css'; 

// 🟢 YOUR RENDER BACKEND URL
const BACKEND_URL = "https://silent-echo-backend.onrender.com"; 

// 🟢 NEW: Robust Connection Options to fix "Disconnected" issue
const socket = io.connect(BACKEND_URL, {
    transports: ['websocket', 'polling'], // Try both methods
    reconnection: true,                   // Always try to reconnect
    reconnectionAttempts: 20,             // Try 20 times
    reconnectionDelay: 1000,              // Wait 1s between tries
    autoConnect: true                     // Connect immediately
});

const ChatRoom = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef(null);
  
  const roomId = location.state?.roomId;
  const partnerName = location.state?.partnerName || "Stranger";

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [partnerLeft, setPartnerLeft] = useState(false);
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [isConnected, setIsConnected] = useState(socket.connected); // Track connection status
  
  // 📞 CALL STATE
  const [isInCall, setIsInCall] = useState(false);
  const [isInitiator, setIsInitiator] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);
  const [callerSignal, setCallerSignal] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // 🟢 FORCE CONNECTION ON LOAD
    if (!socket.connected) {
        socket.connect();
    }

    // 🟢 EVENT LISTENERS
    socket.on('connect', () => {
        console.log("✅ Connected to Server:", socket.id);
        setIsConnected(true);
        if (roomId) socket.emit("join_room", roomId); 
    });

    socket.on('disconnect', () => {
        console.log("❌ Disconnected");
        setIsConnected(false);
    });

    if (!roomId) { navigate('/lobby'); return; }
    
    // Join room if already connected
    if (socket.connected) {
        socket.emit("join_room", roomId);
    }

    socket.on("receive_message", (data) => {
      const decryptedText = decryptMessage(data.text);
      setMessages((list) => [...list, { ...data, text: decryptedText }]);
    });

    socket.on("user_left", () => {
      setPartnerLeft(true);
      setMessages((list) => [...list, { id: Date.now(), text: `${partnerName} has left the chat.`, sender: "system", isSystem: true }]);
      endCall(false); 
    });

    socket.on("call_user", ({ signal }) => {
      console.log("📞 Incoming Call Signal Received");
      setIncomingCall(true);
      setCallerSignal(signal);
    });

    socket.on("call_ended", () => {
        setIsInCall(false);
        setIncomingCall(false);
        setCallerSignal(null);
        setMessages((list) => [...list, { id: Date.now(), text: "📞 Call Ended", sender: "system", isSystem: true }]);
    });

    return () => { 
        socket.off("receive_message"); 
        socket.off("user_left"); 
        socket.off("call_user"); 
        socket.off("call_ended"); 
        socket.off("connect");
        socket.off("disconnect");
    };
    // eslint-disable-next-line
  }, [roomId, navigate, partnerName]);

  const endCall = (notifyServer = true) => {
    if (notifyServer) {
        socket.emit("call_ended", { roomId });
    }
    setIsInCall(false); 
    setIncomingCall(false);
  };

  const startCall = () => {
    setIsInitiator(true);
    setIsInCall(true);
  };

  const acceptCall = () => {
    setIsInCall(true);
    setIsInitiator(false);
    setIncomingCall(false);
  };

  const handleSend = async () => {
    if (!input.trim() || partnerLeft) return;
    const messageData = { room: roomId, id: Date.now(), text: encryptMessage(input), sender: socket.id, time: new Date().toLocaleTimeString() };
    await socket.emit("send_message", messageData);
    setMessages((list) => [...list, { ...messageData, text: input }]); 
    setInput("");
  };

  const leaveChat = () => { socket.emit("leave_room", roomId); navigate('/lobby'); };

  return (
    <div className="chat-container glass-panel">
      {showCrisisModal && <CrisisModal onClose={() => setShowCrisisModal(false)} />}

      {/* 🟢 FULL SCREEN CALL WRAPPER */}
      {isInCall && (
        <div className="voice-call-wrapper">
            <VoiceCall socket={socket} roomId={roomId} isInitiator={isInitiator} callerSignal={callerSignal} onClose={() => endCall(true)} />
        </div>
      )}

      {/* 📞 INCOMING CALL POPUP */}
      {incomingCall && !isInCall && (
        <div className="incoming-call-toast">
            <span>📞 Incoming Call from <b>{partnerName}</b>...</span>
            <div className="call-actions">
                <button onClick={acceptCall} className="accept-btn">Accept</button>
                <button onClick={() => endCall(true)} className="reject-btn">Decline</button>
            </div>
        </div>
      )}

      <div className="chat-header">
        <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
           <FaUserSecret size={20} color="#60a5fa" /> 
           <div>
               <span style={{fontWeight:'bold', fontSize:'1.1rem'}}>{partnerName}</span>
               
               {/* 🟢 STATUS INDICATOR */}
               <div style={{fontSize:'0.7rem', color: isConnected ? '#4ade80' : '#f87171', display: 'flex', alignItems:'center', gap:'5px'}}>
                   <FaCircle size={8} /> 
                   {isConnected ? "Online" : "Disconnected"} 
                   {/* Show only first 4 chars of Room ID for debugging */}
                   <span style={{opacity: 0.5}}> | Room: {roomId?.slice(0,4)}...</span> 
               </div>
           </div>
        </div>
        <div style={{display:'flex', gap:'10px'}}>
            <button onClick={startCall} className="exit-btn call-btn-style"><FaPhoneAlt /> Call</button>
            <button onClick={leaveChat} className="exit-btn"><FaSignOutAlt /> Exit</button>
        </div>
      </div>
      
      <div className="messages-area">
        {messages.map((msg) => (
          <div key={msg.id} className={`message-bubble ${msg.isSystem ? 'system-msg' : (msg.sender === socket.id ? 'my-msg' : 'their-msg')}`}>{msg.text}</div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-box">
        <input type="text" placeholder="Type safely..." value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} />
        <button className="send-btn" onClick={handleSend}><FaPaperPlane size={14} /></button>
      </div>
    </div>
  );
};

export default ChatRoom;