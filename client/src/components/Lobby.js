import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaRobot, FaSmile, FaChartLine, FaSignOutAlt, FaHeart, FaUsers, FaExclamationTriangle } from 'react-icons/fa';
import CrisisModal from './CrisisModal'; 
// 🟢 NEW: Import Firebase
import { db } from '../firebaseConfig'; 
import { ref, push, get, remove, set } from "firebase/database";

const Lobby = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("Friend");
  const [showSOS, setShowSOS] = useState(false); 
  const [isSearching, setIsSearching] = useState(false); // 🟢 NEW: Track searching state

  useEffect(() => {
    const storedName = localStorage.getItem("chat_username");
    if (storedName) setUsername(storedName);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("chat_username");
    navigate('/');
  };

  const handleLegal = (type) => {
    if (type === "Privacy") {
      alert("🔒 PRIVACY POLICY \n\n1. Data Collection: We store chat history and mood logs in a secure MongoDB database.\n2. Anonymity: Peer chats are anonymous; no real names are shared.\n3. Usage: Data is used solely for the functionality of SilentEcho.");
    } else {
      alert("📜 TERMS OF SERVICE \n\n1. Safe Space: Users must be respectful to peer listeners.\n2. Liability: SilentEcho is a self-help tool, not a replacement for professional therapy.\n3. Emergency: In crisis situations, users must contact 112.");
    }
  };

  // 🟢 NEW: FIREBASE MATCHING LOGIC
  const findMatch = async () => {
    setIsSearching(true);
    const roomsRef = ref(db, 'waiting_rooms');

    try {
        // 1. Check if anyone is waiting
        const snapshot = await get(roomsRef);
        
        if (snapshot.exists()) {
            // Someone is waiting! Join them.
            const rooms = snapshot.val();
            const foundRoomId = Object.keys(rooms)[0]; // Get the first waiting room
            
            // Remove them from waiting list (so we are now a pair)
            await remove(ref(db, `waiting_rooms/${foundRoomId}`));
            
            // Go to chat with this Room ID
            navigate('/chat', { state: { roomId: foundRoomId, partnerName: "Stranger" } });
        } else {
            // No one waiting. I will create a room and wait.
            const newRoomRef = push(roomsRef); // Create new spot
            const newRoomId = newRoomRef.key;
            
            // Save placeholder data
            await set(newRoomRef, { created: Date.now() });

            // Navigate to chat and wait there for someone to join
            navigate('/chat', { state: { roomId: newRoomId, partnerName: "Stranger", isHost: true } });
        }
    } catch (error) {
        console.error("Firebase Error:", error);
        alert("Connection failed. Please check your internet.");
        setIsSearching(false);
    }
  };

  return (
    <div style={styles.appContainer}>
      
      {/* SOS MODAL */}
      {showSOS && <CrisisModal onClose={() => setShowSOS(false)} />}

      {/* 🟢 1. STICKY HEADER */}
      <div style={styles.header}>
        <h2 style={styles.logo}>SilentEcho</h2>
        
        <div style={styles.userInfo}>
          <button onClick={() => setShowSOS(true)} style={styles.sosBtn} title="Emergency Help">
            <FaExclamationTriangle /> SOS
          </button>

          <span style={{fontSize: '0.9rem', marginLeft: '10px'}}>Hello, <b>{username}</b></span>
          <button onClick={handleLogout} style={styles.logoutBtn} title="Logout">
            <FaSignOutAlt />
          </button>
        </div>
      </div>

      {/* 🟢 2. SCROLLABLE MIDDLE SECTION */}
      <div style={styles.scrollableMain}>
        <div style={styles.contentWrapper}>
          <div style={styles.textCenter}>
            <h1 style={styles.title}>Your Safe Space</h1>
            <p style={styles.subtitle}>Where would you like to go today?</p>
          </div>

          <div style={styles.gridContainer}>
            {/* 🟢 1. PEER SUPPORT (UPDATED) */}
            <div className="lobby-card" style={styles.glassCard} onClick={findMatch}>
              <div style={{...styles.iconGlow, color: '#f472b6', boxShadow: '0 0 20px rgba(244, 114, 182, 0.4)'}}>
                <FaUsers size={32} />
              </div>
              <h3>Peer Support</h3>
              {/* Show "Connecting..." when clicked */}
              <p style={styles.cardDesc}>
                 {isSearching ? "Connecting..." : "Connect with a human listener."}
              </p>
            </div>

            {/* 2. NOVA AI */}
            <div className="lobby-card" style={styles.glassCard} onClick={() => navigate('/nova')}>
              <div style={{...styles.iconGlow, color: '#67e8f9', boxShadow: '0 0 20px rgba(103, 232, 249, 0.4)'}}>
                <FaRobot size={32} />
              </div>
              <h3>Talk to Nova</h3>
              <p style={styles.cardDesc}>Your empathetic AI friend.</p>
            </div>

            {/* 3. MOOD TRACKER */}
            <div className="lobby-card" style={styles.glassCard} onClick={() => navigate('/mood-tracker')}>
              <div style={{...styles.iconGlow, color: '#fde047', boxShadow: '0 0 20px rgba(253, 224, 71, 0.4)'}}>
                <FaSmile size={32} />
              </div>
              <h3>Mood Tracker</h3>
              <p style={styles.cardDesc}>Log emotions & relax.</p>
            </div>

            {/* 4. MY JOURNEY */}
            <div className="lobby-card" style={styles.glassCard} onClick={() => navigate('/dashboard')}>
              <div style={{...styles.iconGlow, color: '#a78bfa', boxShadow: '0 0 20px rgba(167, 139, 250, 0.4)'}}>
                <FaChartLine size={32} />
              </div>
              <h3>My Journey</h3>
              <p style={styles.cardDesc}>View your progress.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 🟢 3. STICKY FOOTER */}
      <div style={styles.footer}>
        <div style={styles.footerTop}>
          <p style={{margin: 0, fontSize: '0.9rem'}}>
            Made with <FaHeart color="#ff6b6b" style={{margin: '0 5px'}} /> by <b style={{color: '#67e8f9'}}>Sakshi</b>
          </p>
          <span style={styles.version}>v1.0.0 • 2026 © SilentEcho</span>
        </div>

        <div style={styles.footerLinks}>
          <span style={styles.link} onClick={() => handleLegal("Privacy")}>Privacy Policy</span>
          <span style={{color: '#444'}}>|</span>
          <span style={styles.link} onClick={() => handleLegal("Terms")}>Terms of Service</span>
        </div>

        <p style={styles.disclaimer}>
          ⚠️ Not a crisis service. Call <b>112</b> for emergencies.
        </p>
      </div>

    </div>
  );
};

// ... (KEEPING YOUR ORIGINAL STYLES EXACTLY AS THEY WERE) ...
const styles = {
  appContainer: {
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)', 
    color: 'white', fontFamily: "'Segoe UI', sans-serif",
    display: 'flex', flexDirection: 'column', overflow: 'hidden'
  },
  header: {
    height: '70px', padding: '0 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(15px)', borderBottom: '1px solid rgba(255,255,255,0.05)',
    zIndex: 100, flexShrink: 0
  },
  logo: {
    margin: 0, background: 'linear-gradient(to right, #67e8f9, #f472b6)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '1.5rem', letterSpacing: '1px'
  },
  userInfo: { display: 'flex', alignItems: 'center', gap: '15px' },
  sosBtn: {
    background: '#ef4444', color: 'white', border: 'none', padding: '6px 15px',
    borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px',
    boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)', animation: 'pulse-red 2s infinite'
  },
  logoutBtn: {
    background: 'rgba(255, 107, 107, 0.1)', border: '1px solid #ff6b6b', color: '#ff6b6b',
    width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
    display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.3s ease'
  },
  scrollableMain: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' },
  contentWrapper: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' },
  textCenter: { textAlign: 'center', marginBottom: '40px' },
  title: { fontSize: '2.5rem', fontWeight: '300', marginBottom: '5px', textShadow: '0 0 20px rgba(255,255,255,0.2)' },
  subtitle: { color: '#aaa', fontSize: '1rem', fontWeight: '300' },
  gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '25px', width: '100%', maxWidth: '800px' },
  glassCard: {
    background: 'rgba(255, 255, 255, 0.05)', 
    backdropFilter: 'blur(12px)', 
    padding: '30px', 
    borderRadius: '20px',
    cursor: 'pointer', 
    border: '1px solid rgba(255, 255, 255, 0.1)', 
    textAlign: 'center',
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center'
  },
  iconGlow: { marginBottom: '15px', padding: '12px', borderRadius: '50%', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  cardDesc: { color: '#888', fontSize: '0.85rem', marginTop: '8px' },
  footer: {
    padding: '15px', textAlign: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(15px)',
    borderTop: '1px solid rgba(255,255,255,0.05)', color: '#888', display: 'flex', flexDirection: 'column',
    gap: '8px', zIndex: 100, flexShrink: 0
  },
  footerTop: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', flexWrap: 'wrap' },
  version: { fontSize: '0.75rem', color: '#555', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '10px' },
  footerLinks: { display: 'flex', justifyContent: 'center', gap: '15px', fontSize: '0.8rem', color: '#aaa' },
  link: { cursor: 'pointer', transition: 'color 0.2s', textDecoration: 'underline' },
  disclaimer: { margin: 0, fontSize: '0.7rem', color: '#666' }
};

export default Lobby;