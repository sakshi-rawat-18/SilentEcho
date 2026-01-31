import React, { useEffect, useState, useRef } from 'react';
import { FaUserSecret, FaPaperPlane, FaSignOutAlt, FaCircle, FaPhoneAlt } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { ref, push, onValue, off, set } from "firebase/database";
import { encryptMessage, decryptMessage } from '../utils/encryption';
import VoiceCall from './VoiceCall'; // 🟢 Import the new component
import '../App.css'; 

const ChatRoom = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef(null);
  
  const roomId = location.state?.roomId;
  const partnerName = location.state?.partnerName || "Stranger";

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [partnerActive, setPartnerActive] = useState(true);
  
  // 🟢 CALL STATES
  const [isInCall, setIsInCall] = useState(false);
  const [isInitiator, setIsInitiator] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);

  const [myId] = useState(localStorage.getItem("chat_username") || Math.random().toString(36).substr(2, 9));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!roomId) { navigate('/lobby'); return; }

    // 1. Listen for Messages
    const messagesRef = ref(db, `chats/${roomId}`);
    const msgListener = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedMessages = Object.values(data).map(msg => {
            if (msg.system) {
                if (msg.text.includes("disconnected")) setPartnerActive(false);
                return msg; 
            }
            return { ...msg, text: decryptMessage(msg.text) };
        });
        setMessages(loadedMessages);
      }
    });

    // 🟢 2. LISTEN FOR INCOMING CALLS
    const callRef = ref(db, `calls/${roomId}/offer`);
    const callListener = onValue(callRef, (snapshot) => {
        if (snapshot.exists() && !isInitiator && !isInCall) {
            setIncomingCall(true);
        }
    });

    return () => {
        off(messagesRef, msgListener);
        off(callRef, callListener);
    };
    // eslint-disable-next-line
  }, [roomId, navigate]);

  const handleSend = async () => {
    if (!input.trim() || !partnerActive) return;
    const messagesRef = ref(db, `chats/${roomId}`);
    await push(messagesRef, { sender: myId, text: encryptMessage(input), timestamp: Date.now() });
    setInput("");
  };

  const leaveChat = async () => { 
    const messagesRef = ref(db, `chats/${roomId}`);
    await push(messagesRef, { sender: "System", text: "Stranger has disconnected.", system: true, timestamp: Date.now() });
    navigate('/lobby'); 
  };

  // 🟢 START CALL
  const startCall = () => {
      setIsInitiator(true);
      setIsInCall(true);
  };

  // 🟢 ACCEPT CALL
  const acceptCall = () => {
      setIncomingCall(false);
      setIsInitiator(false); // Receiver
      setIsInCall(true);
  };

  return (
    <div className="chat-container glass-panel">
      
      {/* 🟢 FULL SCREEN CALL OVERLAY */}
      {isInCall && (
        <VoiceCall 
            roomId={roomId} 
            isInitiator={isInitiator} 
            onClose={() => setIsInCall(false)} 
        />
      )}

      {/* 🟢 INCOMING CALL POPUP */}
      {incomingCall && !isInCall && (
         <div className="incoming-call-toast">
            <span>📞 Incoming Call...</span>
            <div className="call-actions">
                <button onClick={acceptCall} className="accept-btn">Accept</button>
                <button onClick={() => setIncomingCall(false)} className="reject-btn">Decline</button>
            </div>
         </div>
      )}

      <div className="chat-header">
        <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
           <FaUserSecret size={20} color="#60a5fa" /> 
           <div>
               <span style={{fontWeight:'bold', fontSize:'1.1rem'}}>{partnerName}</span>
               <div style={{fontSize:'0.7rem', color: partnerActive ? '#4ade80' : '#f87171', display: 'flex', alignItems:'center', gap:'5px'}}>
                   <FaCircle size={8} /> {partnerActive ? "Online" : "Disconnected"}
               </div>
           </div>
        </div>
        
        <div style={{display:'flex', gap:'10px'}}>
            <button onClick={startCall} className="exit-btn call-btn-style" style={{background: '#10b981', border:'none'}}>
                <FaPhoneAlt /> Call
            </button>
            <button onClick={leaveChat} className="exit-btn"><FaSignOutAlt /> Exit</button>
        </div>
      </div>
      
      <div className="messages-area">
        {messages.map((msg, index) => (
          <div key={index} className={`message-bubble ${msg.system ? 'system-msg' : (msg.sender === myId ? 'my-msg' : 'their-msg')}`}>
            {msg.text}
          </div>
        ))}
        {!partnerActive && <div className="system-msg">Chat has ended.</div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-box">
        <input type="text" placeholder="Type safely..." value={input} disabled={!partnerActive} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} />
        <button className="send-btn" onClick={handleSend} disabled={!partnerActive}><FaPaperPlane size={14} /></button>
      </div>
    </div>
  );
};

export default ChatRoom;