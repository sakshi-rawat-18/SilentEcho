import React, { useEffect, useState, useRef } from 'react';
import { FaUserSecret, FaPaperPlane, FaSignOutAlt, FaCircle } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
// 🟢 NEW: Import Firebase Database
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
  
  // Create a unique ID for "Me" (just for this session)
  const [myId] = useState(localStorage.getItem("chat_username") || Math.random().toString(36).substr(2, 9));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!roomId) { navigate('/lobby'); return; }

    // 🟢 1. CONNECT TO FIREBASE CHAT ROOM
    const messagesRef = ref(db, `chats/${roomId}`);

    // 🟢 2. LISTEN FOR NEW MESSAGES
    const listener = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert Firebase object to array & Decrypt
        const loadedMessages = Object.values(data).map(msg => ({
          ...msg,
          text: decryptMessage(msg.text) 
        }));
        setMessages(loadedMessages);
      }
    });

    // Cleanup: Stop listening when we leave
    return () => {
      off(messagesRef, listener);
    };
  }, [roomId, navigate]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // 🟢 3. SEND MESSAGE TO FIREBASE
    const messagesRef = ref(db, `chats/${roomId}`);
    
    await push(messagesRef, {
      sender: myId,
      text: encryptMessage(input), // Encrypt before sending
      timestamp: Date.now(),
      senderName: myId // You can change this to a real username if you have one
    });

    setInput("");
  };

  const leaveChat = () => { 
    navigate('/lobby'); 
  };

  return (
    <div className="chat-container glass-panel">
      
      {/* HEADER */}
      <div className="chat-header">
        <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
           <FaUserSecret size={20} color="#60a5fa" /> 
           <div>
               <span style={{fontWeight:'bold', fontSize:'1.1rem'}}>{partnerName}</span>
               
               {/* 🟢 STATUS IS ALWAYS ONLINE WITH FIREBASE */}
               <div style={{fontSize:'0.7rem', color: '#4ade80', display: 'flex', alignItems:'center', gap:'5px'}}>
                   <FaCircle size={8} /> Online (Firebase)
               </div>
           </div>
        </div>
        <button onClick={leaveChat} className="exit-btn"><FaSignOutAlt /> Exit</button>
      </div>
      
      {/* MESSAGES AREA */}
      <div className="messages-area">
        {messages.map((msg, index) => (
          <div key={index} className={`message-bubble ${msg.sender === myId ? 'my-msg' : 'their-msg'}`}>
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="chat-input-box">
        <input 
            type="text" 
            placeholder="Type safely..." 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
        />
        <button className="send-btn" onClick={handleSend}><FaPaperPlane size={14} /></button>
      </div>
    </div>
  );
};

export default ChatRoom;