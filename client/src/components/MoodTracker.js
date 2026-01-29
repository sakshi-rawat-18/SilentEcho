import React, { useState, useRef } from 'react';
import { FaSave, FaArrowLeft, FaMusic, FaPause, FaPlay, FaChartLine } from 'react-icons/fa'; // 🟢 Added FaChartLine
import { useNavigate } from 'react-router-dom';

const MoodTracker = () => {
  const navigate = useNavigate();
  const audioRef = useRef(new Audio());
  
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);

  const moods = [
    { emoji: "😡", score: 1, label: "Angry" },
    { emoji: "😢", score: 2, label: "Sad" },
    { emoji: "😐", score: 3, label: "Okay" },
    { emoji: "🙂", score: 4, label: "Good" },
    { emoji: "🤩", score: 5, label: "Amazing" }
  ];

  // 🎵 Music Tracks
  const tracks = [
    { name: "Heavy Rain",   url: "/rain.mp3" },
    { name: "Ocean Waves",  url: "/ocean.mp3" },
    { name: "Forest Birds", url: "/birds.mp3" },
    { name: "Soft Piano",   url: "/piano.mp3" }
  ];

  const toggleMusic = (track) => {
    if (currentTrack === track.name && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.src = track.url;
      audioRef.current.volume = 1.0; 
      audioRef.current.play()
        .catch(e => alert("Error playing sound. Check connection."));
      setCurrentTrack(track.name);
      setIsPlaying(true);
    }
  };

  const handleSave = async () => {
    if (!selectedEmoji) return;
    setStatus("Saving...");
    try {
      const response = await fetch("http://localhost:5000/api/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emoji: selectedEmoji.emoji,
          score: selectedEmoji.score,
          note: note
        }),
      });
      if (response.ok) {
        setStatus("Saved Successfully! 🌟");
        // We stay on page so they can click the analytics button if they want
        setTimeout(() => setStatus(""), 2000); 
      }
    } catch (error) {
      setStatus("Server Error ❌");
    }
  };

  return (
    <div className="chat-container glass-panel" style={{overflowY: 'auto'}}>
      {/* Header */}
      <div className="chat-header">
         <span>✨ Mood & Music</span>
         <button onClick={() => { audioRef.current.pause(); navigate('/lobby'); }} className="exit-btn">
            <FaArrowLeft /> Back
         </button>
      </div>

      <div className="mood-content">
        {/* 🎵 MUSIC SECTION */}
        <div className="music-player-box">
           <h3><FaMusic /> Sonic Therapy</h3>
           <p>Select a sound to de-stress while you journal.</p>
           
           <div className="track-grid">
             {tracks.map((track) => (
               <button 
                 key={track.name} 
                 className={`track-btn ${currentTrack === track.name && isPlaying ? 'playing' : ''}`}
                 onClick={() => toggleMusic(track)}
               >
                 {currentTrack === track.name && isPlaying ? <FaPause /> : <FaPlay />}
                 <span>{track.name}</span>
               </button>
             ))}
           </div>
        </div>

        <hr style={{width:'100%', borderColor:'rgba(255,255,255,0.1)', margin:'20px 0'}} />

        <h2>How are you feeling?</h2>
        <div className="emoji-grid">
          {moods.map((m) => (
            <button 
              key={m.label}
              className={`emoji-btn ${selectedEmoji?.label === m.label ? 'selected' : ''}`}
              onClick={() => setSelectedEmoji(m)}
            >
              <span style={{fontSize: '2rem'}}>{m.emoji}</span>
              <span className="emoji-label">{m.label}</span>
            </button>
          ))}
        </div>

        <textarea
          className="mood-input"
          placeholder="Why do you feel this way? (Optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <button className="save-btn" onClick={handleSave} disabled={!selectedEmoji}>
           {status ? status : <><FaSave /> Save Entry</>}
        </button>

        {/* 🟢 NEW: Analytics Button (Placed perfectly at the bottom) */}
        <div style={{ marginTop: '25px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
          <button 
            onClick={() => navigate('/analytics')} 
            style={{
              background: 'transparent',
              border: '1px solid #67e8f9',
              color: '#67e8f9',
              padding: '12px 25px',
              borderRadius: '25px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              width: '100%',
              fontSize: '1rem',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.background = 'rgba(103, 232, 249, 0.1)'}
            onMouseOut={(e) => e.target.style.background = 'transparent'}
          >
            <FaChartLine /> View My Mood Journey
          </button>
        </div>

      </div>
    </div>
  );
};

export default MoodTracker;