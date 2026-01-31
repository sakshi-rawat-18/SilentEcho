import React, { useEffect, useState, useRef } from 'react';
import { FaUserSecret, FaPaperPlane, FaSignOutAlt, FaCircle, FaPhoneAlt, FaSpinner, FaLightbulb } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { ref, push, onValue, off, remove, set, onDisconnect } from "firebase/database"; 
import { encryptMessage, decryptMessage } from '../utils/encryption';
import VoiceCall from './VoiceCall'; 
import '../App.css'; 

const PSYCH_FACTS = [
  "Talking to a stranger can actually boost your well-being.",
  "Journaling your feelings reduces stress by 40%.",
  "The color blue has a calming effect on the brain.",
  "Hugging for 20 seconds releases oxytocin, the trust hormone.",
  "Listening to music can significantly reduce anxiety.",
  "Helping others releases endorphins, making you feel happier.",
  "Your brain can't feel pain; headaches involve nerves/muscles."
];

const ChatRoom = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef(null);
  
  const roomId = location.state?.roomId;
  const isHost = location.state?.isHost; 

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [connectionStatus, setConnectionStatus] = useState(isHost ? "waiting" : "connected");
  
  // Facts State
  const [currentFact, setCurrentFact] = useState(PSYCH_FACTS[0]);

  // Call States
  const [isInCall, setIsInCall] = useState(false);
  const [isInitiator, setIsInitiator] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);

  const [myId] = useState(localStorage.getItem("chat_username") || Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    // Cycle facts while waiting
    let interval;
    if (connectionStatus === "waiting") {
        interval = setInterval(() => {
            setCurrentFact(PSYCH_FACTS[Math.floor(Math.random() * PSYCH_FACTS.length)]);
        }, 4000);
    }
    return () => clearInterval(interval);
  }, [connectionStatus]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!roomId) { navigate('/lobby'); return; }

    // 1. REGISTER PRESENCE
    const myPresenceRef = ref(db, `rooms/${roomId}/users/${myId}`);
    set(myPresenceRef, true);
    onDisconnect(myPresenceRef).remove();

    // 2. CHECK USERS
    const usersRef = ref(db, `rooms/${roomId}/users`);
    const usersListener = onValue(usersRef, (snapshot) => {
        if (snapshot.exists()) {
            const count = Object.keys(snapshot.val()).length;
            if (count >= 2) setConnectionStatus("connected");
            else setConnectionStatus("waiting");
        }
    });

    // 3. LISTEN MESSAGES
    const messagesRef = ref(db, `chats/${roomId}`);
    const msgListener = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedMessages = Object.values(data).map(msg => {
            if (msg.system) {
                if (msg.text.includes("disconnected")) setConnectionStatus("disconnected");
                return msg; 
            }
            return { ...msg, text: decryptMessage(msg.text) };
        });
        setMessages(loadedMessages);
      }
    });

    // 4. LISTEN CALLS
    const callRef = ref(db, `calls/${roomId}`);
    const callListener = onValue(callRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.offer && !isInitiator && !isInCall) setIncomingCall(true);
        if (!data && isInCall) {
            setIsInCall(false);
            setIncomingCall(false);
            setIsInitiator(false);
        }
    });

    return () => {
        remove(myPresenceRef);
        off(usersRef, usersListener);
        off(messagesRef, msgListener);
        off(callRef, callListener);
    };
    // eslint-disable-next-line
  }, [roomId, navigate, isInCall, isInitiator]);

  const handleSend = async () => {
    if (!input.trim() || connectionStatus !== "connected") return;
    const messagesRef = ref(db, `chats/${roomId}`);
    await push(messagesRef, { sender: myId, text: encryptMessage(input), timestamp: Date.now() });
    setInput("");
  };

  const leaveChat = async () => { 
    const messagesRef = ref(db, `chats/${roomId}`);
    await push(messagesRef, { sender: "System", text: "Stranger has disconnected.", system: true, timestamp: Date.now() });
    navigate('/lobby'); 
  };

  const startCall = () => { setIsInitiator(true); setIsInCall(true); };
  const acceptCall = () => { setIncomingCall(false); setIsInitiator(false); setIsInCall(true); };
  const declineCall = async () => { setIncomingCall(false); await remove(ref(db, `calls/${roomId}`)); };

  const getStatusUI = () => {
      if (connectionStatus === "waiting") return { color: '#fde047', text: "Waiting...", icon: <FaSpinner className="spinner"/> };
      if (connectionStatus === "connected") return { color: '#4ade80', text: "Online", icon: <FaCircle size={8}/> };
      return { color: '#f87171', text: "Disconnected", icon: <FaCircle size={8}/> };
  };

  const status = getStatusUI();

  return (
    <div className="chat-container glass-panel">
      
      {/* 🟢 WAITING SCREEN OVERLAY (With Facts) */}
      {connectionStatus === "waiting" && (
        <div style={styles.waitingOverlay}>
            <div className="pulse-ring" style={{width:'80px', height:'80px', border:'3px solid #67e8f9'}}></div>
            <h2 style={{marginTop: '30px', zIndex: 2}}>Searching for a Partner...</h2>
            <p style={{color:'#aaa', marginBottom:'40px', zIndex:2}}>Please wait, connecting you to a peer.</p>
            
            <div style={styles.factBox}>
                <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px', color:'#fde047'}}>
                    <FaLightbulb /> <span style={{fontSize:'0.9rem', fontWeight:'bold'}}>DID YOU KNOW?</span>
                </div>
                <p style={{fontStyle: 'italic', fontSize: '1.1rem', lineHeight:'1.5'}}>"{currentFact}"</p>
            </div>
            
            <button onClick={leaveChat} style={{...styles.exitBtn, marginTop:'30px', zIndex:2}}>Cancel Search</button>
        </div>
      )}

      {isInCall && <VoiceCall roomId={roomId} isInitiator={isInitiator} onClose={() => setIsInCall(false)} />}

      {incomingCall && !isInCall && (
         <div className="incoming-call-toast">
            <div className="pulse-circle"></div>
            <span>📞 Incoming Call...</span>
            <div className="call-actions">
                <button onClick={acceptCall} className="accept-btn">Accept</button>
                <button onClick={declineCall} className="reject-btn">Decline</button>
            </div>
         </div>
      )}

      <div className="chat-header">
        <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
           <FaUserSecret size={20} color="#60a5fa" /> 
           <div>
               <span style={{fontWeight:'bold', fontSize:'1.1rem'}}>Stranger</span>
               <div style={{fontSize:'0.7rem', color: status.color, display: 'flex', alignItems:'center', gap:'5px'}}>
                   {status.icon} {status.text}
               </div>
           </div>
        </div>
        
        <div style={{display:'flex', gap:'10px'}}>
            <button 
                onClick={startCall} 
                className="exit-btn call-btn-style" 
                disabled={connectionStatus !== "connected"}
                style={{
                    background: connectionStatus === "connected" ? '#10b981' : '#374151', 
                    border:'none', 
                    cursor: connectionStatus === "connected" ? 'pointer' : 'not-allowed',
                    opacity: connectionStatus === "connected" ? 1 : 0.5
                }}
            >
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
        {connectionStatus === "disconnected" && <div className="system-msg">Chat has ended.</div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-box">
        <input 
            type="text" 
            placeholder={connectionStatus === "connected" ? "Type safely..." : "Waiting..."} 
            value={input} 
            disabled={connectionStatus !== "connected"} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
        />
        <button className="send-btn" onClick={handleSend} disabled={connectionStatus !== "connected"}><FaPaperPlane size={14} /></button>
      </div>
    </div>
  );
};

// 🟢 NEW STYLES FOR OVERLAY
const styles = {
    waitingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(15, 12, 41, 0.98)', // Almost opaque background
        zIndex: 50, // Covers the chat
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        textAlign: 'center'
    },
    factBox: {
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '25px',
        borderRadius: '15px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        maxWidth: '400px',
        width: '90%',
        zIndex: 2
    },
    exitBtn: {
        background: 'transparent',
        border: '1px solid #ef4444',
        color: '#ef4444',
        padding: '10px 20px',
        borderRadius: '20px',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: 'bold',
        transition: 'all 0.3s'
    }
};

export default ChatRoom;