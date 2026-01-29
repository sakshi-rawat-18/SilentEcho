import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSpinner } from 'react-icons/fa';
import io from 'socket.io-client';

// 🟢 DEPLOYMENT CONFIGURATION
// When you deploy your server to Render, paste that URL here!
// Example: const BACKEND_URL = "https://silentecho-api.onrender.com";
const BACKEND_URL = "http://localhost:5000"; 

// Connect using the variable
const socket = io.connect(BACKEND_URL);

const WaitingRoom = () => {
  const navigate = useNavigate();
  const [factIndex, setFactIndex] = useState(0);

  // 1. GET THE SAVED NAME (or default to Anonymous)
  const myName = localStorage.getItem("chat_username") || "Anonymous";

  const facts = [
    "Did you know? Writing down your worries can reduce anxiety by 40%.",
    "Fun Fact: Your brain uses 20% of your body's total energy.",
    "Psychology says: Hearing your name creates a unique spike in brain activity.",
    "Tip: Deep breathing triggers your body's 'Relaxation Response' instantly.",
    "Did you know? Altruism (helping others) releases endorphins, the 'Helper's High'."
  ];

  useEffect(() => {
    // 2. SEND NAME WHEN JOINING QUEUE
    socket.emit("join_queue", { name: myName });

    // 3. LISTEN FOR A MATCH
    socket.on("match_found", (data) => {
      // 4. RECEIVE PARTNER'S NAME & ROOM ID
      navigate('/chat', { 
        state: { 
            roomId: data.roomId,
            partnerName: data.partnerName // Pass this to ChatRoom
        } 
      });
    });

    // Cycle facts
    const interval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % facts.length);
    }, 4000);

    return () => {
        clearInterval(interval);
        socket.off("match_found");
    };
    // eslint-disable-next-line
  }, [navigate, myName]); // Added eslint disable to ignore 'facts.length' warning

  return (
    <div className="waiting-container glass-panel">
      <div className="pulse-ring"></div>
      <div className="waiting-content">
        <FaSpinner className="spin-icon" size={50} color="#67e8f9" />
        <h2>Searching for a Listener...</h2>
        <p style={{marginTop: '10px', color: '#cbd5e1'}}>Joining as: <strong>{myName}</strong></p>
        
        <div className="fact-card">
          <span className="fact-label">✨ While you wait:</span>
          <p key={factIndex} className="fact-text">{facts[factIndex]}</p>
        </div>

        <button className="cancel-btn" onClick={() => navigate('/lobby')}>
          Cancel Search
        </button>
      </div>
    </div>
  );
};

export default WaitingRoom;