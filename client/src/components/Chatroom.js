import React, { useEffect, useState, useRef } from 'react';
import { FaUserSecret, FaPaperPlane, FaSignOutAlt, FaCircle, FaPhoneAlt } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { ref, push, onValue, off } from "firebase/database";
import { encryptMessage, decryptMessage } from '../utils/encryption';
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
  
  const [myId] = useState(localStorage.getItem("chat_username") || Math.random().toString(36).substr(2, 9));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!roomId) { navigate('/lobby'); return; }

    const messagesRef = ref(db, `chats/${roomId}`);

    const listener = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedMessages = Object.values(data).map(msg => {
            // 🟢 Handle System Messages (User Left)
            if (msg.system) {
                if (msg.text.includes("disconnected")) setPartnerActive(false);
                return msg; 
            }
            return { ...msg, text: decryptMessage(msg.text) };
        });
        setMessages(loadedMessages);
      }
    });

    return () => off(messagesRef, listener);
  }, [roomId, navigate]);

  const handleSend = async () => {
    if (!input.trim() || !partnerActive) return;

    const messagesRef = ref(db, `chats/${roomId}`);
    await push(messagesRef, {
      sender: myId,
      text: encryptMessage(input),
      timestamp: Date.now()
    });
    setInput("");
  };

  // 🟢 HANDLE EXIT: Notify partner before leaving
  const leaveChat = async () => { 
    const messagesRef = ref(db, `chats/${roomId}`);
    await push(messagesRef, {
        sender: "System",
        text: "Stranger has disconnected.",
        system: true, // Mark as system message
        timestamp: Date.now()
    });
    navigate('/lobby'); 
  };

  const startCall = () => {
      alert("📞 Voice Calling is being updated for the new secure server! Coming very soon.");
  };

  return (
    <div className="chat-container glass-panel">
      
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
        
        {/* 🟢 BUTTONS RESTORED */}
        <div style={{display:'flex', gap:'10px'}}>
            <button onClick={startCall} className="exit-btn call-btn-style" style={{background: '#10b981', border:'none'}}>
                <FaPhoneAlt /> Call
            </button>
            <button onClick={leaveChat} className="exit-btn">
                <FaSignOutAlt /> Exit
            </button>
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
        <input 
            type="text" 
            placeholder={partnerActive ? "Type safely..." : "Partner disconnected"} 
            value={input} 
            disabled={!partnerActive}
            onChange={(e) => setInput(e.target.value)} 
            onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
        />
        <button className="send-btn" onClick={handleSend} disabled={!partnerActive}><FaPaperPlane size={14} /></button>
      </div>
    </div>
  );
};

export default ChatRoom;