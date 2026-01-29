import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowRight, FaMicrophoneLines } from 'react-icons/fa6'; 

const LandingPage = () => {
  const [name, setName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();

  const handleLogin = () => {
    if (name.trim() && agreed) {
      localStorage.setItem('chat_username', name);
      navigate('/lobby');
    } else if (!agreed) {
      alert("Please agree to the Terms & Privacy Policy to continue.");
    }
  };

  const showLegal = (type) => {
    if (type === "Privacy") {
      alert("🔒 PRIVACY POLICY:\n\n1. No data selling.\n2. Anonymous chats.\n3. Local storage only.");
    } else {
      alert("📜 TERMS:\n\n1. Be kind.\n2. Not a medical service.\n3. Call 112 in emergencies.");
    }
  };

  return (
    <div className="app-container">
      <div className="glass-card">
        
        {/* LOGO & TITLE */}
        <div style={styles.logoWrapper}>
           <div style={styles.logoIconBox}>
             <FaMicrophoneLines style={{fontSize: '2.5rem', color: 'white'}} />
           </div>
           
           {/* 🟢 FIXED: Removed buggy gradient background, added Glow */}
           <h1 style={styles.title}>SilentEcho</h1>
           <p style={styles.tagline}>Speak freely. Be heard.</p>
        </div>

        {/* INPUT SECTION */}
        <div style={styles.inputWrapper}>
          <input
            type="text"
            placeholder="Enter your name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            className="lobby-input"
            style={{textAlign: 'center', fontWeight: 'bold'}} 
          />
        </div>

        {/* CONSENT CHECKBOX */}
        <div style={styles.consentBox}>
          <input 
            type="checkbox" 
            id="terms" 
            checked={agreed} 
            onChange={(e) => setAgreed(e.target.checked)}
            style={styles.checkbox}
          />
          <label htmlFor="terms" style={styles.label}>
            I agree to <span style={styles.link} onClick={() => showLegal("Terms")}>Terms</span> & <span style={styles.link} onClick={() => showLegal("Privacy")}>Privacy</span>
          </label>
        </div>

        {/* ENTER BUTTON */}
        <button 
          onClick={handleLogin} 
          className="enter-btn" 
          disabled={!name.trim() || !agreed}
        >
          Enter Safe Space <FaArrowRight />
        </button>

        <p style={styles.signature}>
          Built by <b>Sakshi</b>
        </p>

      </div>
    </div>
  );
};

const styles = {
  logoWrapper: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px'
  },
  logoIconBox: {
    width: '70px',
    height: '70px',
    background: 'linear-gradient(135deg, #67e8f9, #a78bfa)', // Cyan to Purple
    borderRadius: '20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 0 20px rgba(103, 232, 249, 0.5)',
    marginBottom: '20px'
  },
  // 🟢 FIXED TITLE STYLE
  title: {
    fontSize: '3rem', 
    fontWeight: 'bold', 
    margin: 0,
    color: 'white', // Solid White
    textShadow: '0 0 15px rgba(103, 232, 249, 0.6)', // Cyan Glow behind text
    letterSpacing: '1px'
  },
  tagline: {
    color: '#aaa', fontSize: '1rem', marginTop: '5px'
  },
  inputWrapper: {
    background: 'rgba(255, 255, 255, 0.1)', // Slightly lighter for visibility
    padding: '15px 25px',
    borderRadius: '50px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    marginBottom: '20px',
    transition: '0.3s'
  },
  consentBox: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '10px', fontSize: '0.85rem', color: '#ccc', marginBottom: '25px'
  },
  checkbox: {
    width: '16px', height: '16px', cursor: 'pointer', accentColor: '#67e8f9'
  },
  label: { cursor: 'pointer', userSelect: 'none' },
  link: { color: '#67e8f9', textDecoration: 'underline', cursor: 'pointer' },
  signature: {
    position: 'absolute', bottom: '15px', left: 0, right: 0, 
    color: '#666', fontSize: '0.75rem', opacity: 0.7
  }
};

export default LandingPage;