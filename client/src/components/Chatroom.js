import React, { useEffect, useState, useRef } from 'react';
import { FaUserSecret, FaPaperPlane, FaSignOutAlt, FaPhoneAlt } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import CrisisModal from './CrisisModal'; 
import VoiceCall from './VoiceCall'; 
import { encryptMessage, decryptMessage } from '../utils/encryption';
import './App.css'; // Ensure you have this CSS file imported!

// 🟢 IMPORTANT: Replace this with your EXACT Render Backend URL
// Check your Render Dashboard if you aren't sure. It usually ends in .onrender.com
const BACKEND_URL = "https://silent-echo-backend.onrender.com"; 

const socket = io.connect(BACKEND_URL);

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
  
  // 📞 CALL STATE
  const [isInCall, setIsInCall] = useState(false);
  const [isInitiator, setIsInitiator] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);
  const [callerSignal, setCallerSignal] = useState(null);

  // Auto-scroll to bottom when message arrives
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkSafety = (text) => {
    const dangerWords = ["suicide", "kill myself", "die", "end it"];
    if (dangerWords.some(word => text.toLowerCase().includes(word))) setShowCrisisModal(true);
  };

  useEffect(() => {
    if (!roomId) { navigate('/lobby'); return; }
    socket.emit("join_room", roomId);

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
        setMessages((list) => [...list, { 
            id: Date.now(), 
            text: "📞 Call Ended", 
            sender: "system", 
            isSystem: true 
        }]);
    });

    return () => { 
        socket.off("receive_message"); 
        socket.off("user_left"); 
        socket.off("call_user"); 
        socket.off("call_ended"); 
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
    checkSafety(input);
    const messageData = { room: roomId, id: Date.now(), text: encryptMessage(input), sender: socket.id, time: new Date().toLocaleTimeString() };
    await socket.emit("send_message", messageData);
    setMessages((list) => [...list, { ...messageData, text: input }]); 
    setInput("");
  };

  const leaveChat = () => { socket.emit("leave_room", roomId); navigate('/lobby'); };

  return (
    <div className="chat-container glass-panel">
      {showCrisisModal && <CrisisModal onClose={() => setShowCrisisModal(false)} />}

      {/* 📞 VOICE CALL MODAL */}
      {isInCall && (
        <VoiceCall 
           socket={socket} 
           roomId={roomId} 
           isInitiator={isInitiator}
           callerSignal={callerSignal}
           onClose={() => endCall(true)} 
        />
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
           <span style={{fontWeight:'bold', fontSize:'1.1rem'}}>{partnerName}</span>
        </div>
        <div style={{display:'flex', gap:'10px'}}>
            <button onClick={startCall} className="exit-btn call-btn-style"><FaPhoneAlt /> Call</button>
            <button onClick={leaveChat} className="exit-btn"><FaSignOutAlt /> Exit</button>
        </div>
      </div>
      
      {/* 🟢 THIS CLASS NAME MUST MATCH THE CSS BELOW */}
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