import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaPaperPlane, FaRobot, FaUser, FaTrash, FaBroom } from 'react-icons/fa'; 
import { useNavigate } from 'react-router-dom';

const NovaAI = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const username = localStorage.getItem("chat_username") || "Guest";

  // 1. LOAD HISTORY
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`https://silentecho-eypq.onrender.com/api/chat-history/${username}`);
        const history = res.data.map(msg => ({
          id: msg._id,
          text: msg.message,
          sender: msg.sender 
        }));
        setMessages(history);
      } catch (err) {
        console.error("Failed to load history:", err);
      }
    };
    fetchHistory();
  }, [username]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 2. SEND MESSAGE
  const handleSend = async () => {
    if (!input.trim()) return;

    const tempId = Date.now();
    const userMsg = { id: tempId, text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      await axios.post('https://silentecho-eypq.onrender.com/api/ai-chat', {
        message: input,
        username: username 
      });

      const historyRes = await axios.get(`https://silentecho-eypq.onrender.com/api/chat-history/${username}`);
      const history = historyRes.data.map(msg => ({
        id: msg._id,
        text: msg.message,
        sender: msg.sender 
      }));
      setMessages(history);

    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. DELETE SINGLE MESSAGE
  const handleDelete = async (id) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
    try {
      await axios.delete(`https://silentecho-eypq.onrender.com/api/chat/${id}`);
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  // 4. CLEAR ALL CHAT
  const handleClearChat = async () => {
    if (!window.confirm("Are you sure you want to delete your entire chat history?")) {
      return;
    }

    try {
      setMessages([]);
      await axios.delete(`https://silentecho-eypq.onrender.com/api/chat-history/${username}`);
    } catch (err) {
      alert("Failed to clear chat. Try again.");
    }
  };

  return (
    <div style={styles.container}>
      {/* 🟢 FIXED HEADER */}
      <div style={styles.header}>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px', minWidth: '150px'}}>
          <FaRobot size={24} color="#67e8f9" />
          <h2 style={{margin: 0, fontSize: '1.2rem', whiteSpace: 'nowrap'}}>Nova AI Assistant</h2>
        </div>

        {/* 🟢 Added more gap here to prevent overlap */}
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <button onClick={handleClearChat} style={styles.clearBtn} title="Clear Chat History">
            <FaBroom /> Clear
          </button>

          <button onClick={() => navigate('/lobby')} style={styles.exitBtn}>
            Exit
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div style={styles.chatBox}>
        {messages.length === 0 && (
          <div style={{textAlign: 'center', marginTop: '50px', color: '#888'}}>
            <FaRobot size={50} style={{marginBottom: '20px', opacity: 0.5}} />
            <p>Hi {username}! I'm Nova.</p>
            <p>Your history is clean. Let's start fresh! ✨</p>
          </div>
        )}

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            style={{
              ...styles.messageRow, 
              justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            {msg.sender === 'user' && (
              <button onClick={() => handleDelete(msg.id)} style={styles.deleteBtn}>
                <FaTrash size={12} />
              </button>
            )}

            {msg.sender === 'bot' && <div style={styles.avatar}><FaRobot /></div>}
            
            <div style={{
              ...styles.bubble,
              background: msg.sender === 'user' ? '#67e8f9' : '#2d2d44',
              color: msg.sender === 'user' ? '#000' : '#fff',
              borderBottomRightRadius: msg.sender === 'user' ? '0' : '15px',
              borderTopLeftRadius: msg.sender === 'bot' ? '0' : '15px',
            }}>
              {msg.text}
            </div>

            {msg.sender === 'user' && <div style={styles.avatarUser}><FaUser /></div>}

            {msg.sender === 'bot' && (
              <button onClick={() => handleDelete(msg.id)} style={styles.deleteBtn}>
                <FaTrash size={12} />
              </button>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div style={{textAlign: 'left', padding: '10px', color: '#aaa'}}>
            Nova is thinking... 💭
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={styles.inputArea}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          style={styles.input}
          disabled={isLoading}
        />
        <button 
          onClick={handleSend} 
          style={{...styles.sendBtn, opacity: isLoading || !input.trim() ? 0.5 : 1}}
          disabled={isLoading || !input.trim()}
        >
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#1a1a2e',
    color: 'white',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  },
  header: {
    padding: '15px 20px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
    flexWrap: 'wrap', // Prevents squishing on very small screens
    gap: '10px'
  },
  // 🟢 FIXED BUTTON STYLES
  exitBtn: {
    background: 'transparent',
    border: '1px solid #ff6b6b',
    color: '#ff6b6b',
    padding: '6px 16px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    transition: '0.3s'
  },
  clearBtn: {
    background: 'rgba(255, 107, 107, 0.15)', // Slightly stronger bg for visibility
    border: 'none', // Removed border to reduce visual clutter
    color: '#ff6b6b',
    padding: '8px 16px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontWeight: '500',
    transition: '0.3s'
  },
  chatBox: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  messageRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '5px'
  },
  avatar: {
    width: '35px',
    height: '35px',
    borderRadius: '50%',
    background: '#67e8f9',
    color: '#000',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '1.2rem'
  },
  avatarUser: {
    width: '35px',
    height: '35px',
    borderRadius: '50%',
    background: '#888',
    color: '#fff',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '1rem'
  },
  bubble: {
    maxWidth: '70%',
    padding: '12px 18px',
    borderRadius: '15px',
    lineHeight: '1.5',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
  },
  deleteBtn: {
    background: 'transparent',
    border: 'none',
    color: '#ff6b6b',
    cursor: 'pointer',
    padding: '5px',
    opacity: 0.6,
    transition: 'opacity 0.2s',
    display: 'flex',
    alignItems: 'center'
  },
  inputArea: {
    padding: '20px',
    background: 'rgba(0, 0, 0, 0.2)',
    display: 'flex',
    gap: '10px'
  },
  input: {
    flex: 1,
    padding: '15px',
    borderRadius: '25px',
    border: 'none',
    background: '#2d2d44',
    color: 'white',
    fontSize: '1rem',
    outline: 'none'
  },
  sendBtn: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    border: 'none',
    background: '#67e8f9',
    color: '#000',
    fontSize: '1.2rem',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'transform 0.2s'
  }
};

export default NovaAI;