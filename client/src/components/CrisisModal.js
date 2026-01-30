import React, { useState } from 'react';
import { FaHeartbeat, FaPhoneAlt, FaTimes } from 'react-icons/fa';
import '../App.css'; // Make sure to create/update this CSS file!

const CrisisModal = ({ onClose }) => {
  const [isBreathing, setIsBreathing] = useState(false);

  return (
    <div className="modal-overlay">
      <div className="crisis-card">
        
        {isBreathing ? (
          /* --- BREATHING EXERCISE VIEW --- */
          <div className="breathing-container">
            <h2 className="breathing-text">Breathe In... Breathe Out...</h2>
            <div className="breathing-circle"></div>
            <button className="glow-button" onClick={() => setIsBreathing(false)}>
                Stop Exercise
            </button>
          </div>
        ) : (
          /* --- NORMAL CRISIS VIEW --- */
          <>
            <div className="crisis-header">
              <FaHeartbeat size={40} color="#ef4444" className="pulse-icon" />
              <h2 className="modal-title">You Are Not Alone</h2>
            </div>
            
            <p className="crisis-text">
              It sounds like you're going through a difficult time. 
              There are people who want to support you right now.
            </p>

            <div className="helpline-box">
              <div className="helpline-row">
                <span>🇮🇳 India Suicide Prevention:</span>
                <a href="tel:9820466726" className="phone-link glow-text">
                  <FaPhoneAlt /> 9820466726
                </a>
              </div>
              <div className="helpline-row">
                <span>🌍 Global Emergency:</span>
                <a href="tel:112" className="phone-link glow-text">
                  <FaPhoneAlt /> 112
                </a>
              </div>
            </div>

            <div className="crisis-actions">
              <button className="breathing-btn" onClick={() => setIsBreathing(true)}>
                 🌬️ Deep Breath
              </button>
              <button className="close-crisis-btn" onClick={onClose}>
                <FaTimes /> Back to Chat
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CrisisModal;