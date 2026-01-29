import React, { useState } from 'react';
import { FaHeartbeat, FaPhoneAlt, FaTimes } from 'react-icons/fa';

const CrisisModal = ({ onClose }) => {
  const [isBreathing, setIsBreathing] = useState(false); // 🆕 New State

  return (
    <div className="modal-overlay">
      <div className="crisis-card">
        
        {/* 🆕 LOGIC: If Breathing, show Circle. If not, show Help. */}
        {isBreathing ? (
          <div className="breathing-container">
            <h2 style={{color: '#fff', marginBottom:'20px'}}>Breathe In... Breathe Out...</h2>
            <div className="breathing-circle"></div>
            <button className="close-crisis-btn" onClick={() => setIsBreathing(false)} style={{marginTop:'30px'}}>
               Stop Exercise
            </button>
          </div>
        ) : (
          // --- NORMAL CRISIS VIEW ---
          <>
            <div className="crisis-header">
              <FaHeartbeat size={40} color="#ef4444" className="pulse-icon" />
              <h2 style={{color: '#fff'}}>You Are Not Alone</h2>
            </div>
            
            <p className="crisis-text">
              It sounds like you're going through a difficult time. 
              There are people who want to support you right now.
            </p>

            <div className="helpline-box">
              <div className="helpline-row">
                <span>🇮🇳 India Suicide Prevention:</span>
                <a href="tel:9820466726" className="phone-link"><FaPhoneAlt /> 9820466726</a>
              </div>
              <div className="helpline-row">
                <span>🌍 Global Emergency:</span>
                <a href="tel:112" className="phone-link"><FaPhoneAlt /> 112</a>
              </div>
            </div>

            <div className="crisis-actions">
              <button className="breathing-btn" onClick={() => setIsBreathing(true)}>
                 🌬️ Take a Deep Breath
              </button>
              <button className="close-crisis-btn" onClick={onClose}>
                <FaTimes /> I'm safe, back to chat
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CrisisModal;