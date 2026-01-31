import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaRobot, FaSmile, FaChartLine, FaSignOutAlt, FaHeart, FaUsers, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import CrisisModal from './CrisisModal'; 
import { db } from '../firebaseConfig'; 
import { ref, push, get, remove, set } from "firebase/database";

const PSYCH_FACTS = [
  "Talking to a stranger can actually boost your well-being more than you think.",
  "Journaling your feelings reduces stress by 40%.",
  "The color blue has a calming effect on the brain.",
  "Hugging for 20 seconds releases oxytocin, the trust hormone.",
  "Listening to music can significantly reduce anxiety.",
  "Helping others releases endorphins, making you feel happier."
];

const Lobby = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("Friend");
  const [showSOS, setShowSOS] = useState(false); 
  
  // 🟢 SEARCHING STATE & FACTS
  const [isSearching, setIsSearching] = useState(false);
  const [currentFact, setCurrentFact] = useState(PSYCH_FACTS[0]);

  useEffect(() => {
    const storedName = localStorage.getItem("chat_username");
    if (storedName) setUsername(storedName);
  }, []);

  // Cycle facts while searching
  useEffect(() => {
    let interval;
    if (isSearching) {
        interval = setInterval(() => {
            const randomFact = PSYCH_FACTS[Math.floor(Math.random() * PSYCH_FACTS.length)];
            setCurrentFact(randomFact);
        }, 3000);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  const handleLogout = () => {
    localStorage.removeItem("chat_username");
    navigate('/');
  };

  const findMatch = async () => {
    setIsSearching(true); // 🟢 SHOW LOADING SCREEN
    const roomsRef = ref(db, 'waiting_rooms');

    try {
        const snapshot = await get(roomsRef);
        
        if (snapshot.exists()) {
            const rooms = snapshot.val();
            const foundRoomId = Object.keys(rooms)[0];
            await remove(ref(db, `waiting_rooms/${foundRoomId}`));
            navigate('/chat', { state: { roomId: foundRoomId, partnerName: "Stranger" } });
        } else {
            const newRoomRef = push(roomsRef);
            const newRoomId = newRoomRef.key;
            await set(newRoomRef, { created: Date.now() });
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
      {showSOS && <CrisisModal onClose={() => setShowSOS(false)} />}

      {/* 🟢 LOADING OVERLAY WITH FACTS */}
      {isSearching && (
        <div style={styles.loadingOverlay}>
            <FaSpinner className="spinner" size={50} color="#67e8f9" />
            <h2 style={{marginTop: '20px'}}>Finding a Partner...</h2>
            <div style={styles.factBox}>
                <p style={{fontSize: '0.9rem', color: '#aaa', marginBottom: '5px'}}>DID YOU KNOW?</p>
                <p style={{fontStyle: 'italic', fontSize: '1.1rem'}}>"{currentFact}"</p>
            </div>
        </div>
      )}

      {/* HEADER */}
      <div style={styles.header}>
        <h2 style={styles.logo}>SilentEcho</h2>
        <div style={styles.userInfo}>
          <button onClick={() => setShowSOS(true)} style={styles.sosBtn}><FaExclamationTriangle /> SOS</button>
          <span style={{fontSize: '0.9rem', marginLeft: '10px'}}>Hello, <b>{username}</b></span>
          <button onClick={handleLogout} style={styles.logoutBtn}><FaSignOutAlt /></button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={styles.scrollableMain}>
        <div style={styles.contentWrapper}>
          <div style={styles.textCenter}>
            <h1 style={styles.title}>Your Safe Space</h1>
            <p style={styles.subtitle}>Where would you like to go today?</p>
          </div>

          <div style={styles.gridContainer}>
            <div className="lobby-card" style={styles.glassCard} onClick={findMatch}>
              <div style={{...styles.iconGlow, color: '#f472b6', boxShadow: '0 0 20px rgba(244, 114, 182, 0.4)'}}><FaUsers size={32} /></div>
              <h3>Peer Support</h3>
              <p style={styles.cardDesc}>Connect with a human listener.</p>
            </div>

            <div className="lobby-card" style={styles.glassCard} onClick={() => navigate('/nova')}>
              <div style={{...styles.iconGlow, color: '#67e8f9', boxShadow: '0 0 20px rgba(103, 232, 249, 0.4)'}}><FaRobot size={32} /></div>
              <h3>Talk to Nova</h3>
              <p style={styles.cardDesc}>Your empathetic AI friend.</p>
            </div>

            <div className="lobby-card" style={styles.glassCard} onClick={() => navigate('/mood-tracker')}>
              <div style={{...styles.iconGlow, color: '#fde047', boxShadow: '0 0 20px rgba(253, 224, 71, 0.4)'}}><FaSmile size={32} /></div>
              <h3>Mood Tracker</h3>
              <p style={styles.cardDesc}>Log emotions & relax.</p>
            </div>

            <div className="lobby-card" style={styles.glassCard} onClick={() => navigate('/dashboard')}>
              <div style={{...styles.iconGlow, color: '#a78bfa', boxShadow: '0 0 20px rgba(167, 139, 250, 0.4)'}}><FaChartLine size={32} /></div>
              <h3>My Journey</h3>
              <p style={styles.cardDesc}>View your progress.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* FOOTER */}
      <div style={styles.footer}>
         Made with <FaHeart color="#ff6b6b" /> by Sakshi
      </div>
    </div>
  );
};

// STYLES (Includes new Loading Overlay)
const styles = {
  appContainer: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)', color: 'white', display: 'flex', flexDirection: 'column' },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 12, 41, 0.95)', zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(10px)' },
  factBox: { marginTop: '30px', padding: '20px', borderLeft: '4px solid #67e8f9', background: 'rgba(255,255,255,0.05)', maxWidth: '400px', textAlign: 'center' },
  header: { height: '70px', padding: '0 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)' },
  logo: { background: 'linear-gradient(to right, #67e8f9, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '1.5rem' },
  userInfo: { display: 'flex', alignItems: 'center', gap: '15px' },
  sosBtn: { background: '#ef4444', color: 'white', border: 'none', padding: '6px 15px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' },
  logoutBtn: { background: 'transparent', border: '1px solid #ff6b6b', color: '#ff6b6b', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' },
  scrollableMain: { flex: 1, overflowY: 'auto' },
  contentWrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px' },
  textCenter: { textAlign: 'center', marginBottom: '40px' },
  title: { fontSize: '2.5rem', fontWeight: '300' },
  subtitle: { color: '#aaa' },
  gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '25px', maxWidth: '800px' },
  glassCard: { background: 'rgba(255, 255, 255, 0.05)', padding: '30px', borderRadius: '20px', cursor: 'pointer', border: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  iconGlow: { marginBottom: '15px', padding: '12px', borderRadius: '50%', background: 'rgba(0,0,0,0.2)' },
  cardDesc: { color: '#888', fontSize: '0.85rem', marginTop: '8px' },
  footer: { padding: '15px', textAlign: 'center', color: '#666', fontSize: '0.8rem' }
};

export default Lobby;