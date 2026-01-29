import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

const MoodDashboard = () => {
  const [moodData, setMoodData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('https://silentecho-eypq.onrender.com/api/moods')
      .then(res => {
        const formatted = res.data.map(item => ({
          score: item.score,
          date: new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        })).reverse();
        setMoodData(formatted);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching data:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div style={styles.dashboardContainer}>
      
      {/* 🟢 FIXED: Back goes to Lobby now */}
      <button onClick={() => navigate('/lobby')} style={styles.backBtn}>
        <FaArrowLeft style={{ marginRight: '8px' }} />
        Back to Lobby
      </button>

      <h3 style={styles.title}>
        My Mood Journey 📊
      </h3>

      {loading ? (
        <p style={{textAlign: 'center', color: '#888'}}>Loading your stats... ⏳</p>
      ) : moodData.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={{fontSize: '1.2rem', marginBottom: '10px'}}>No mood entries found yet!</p>
          <button onClick={() => navigate('/mood')} style={styles.actionBtn}>
            Go to Tracker
          </button>
        </div>
      ) : (
        <div style={{ width: '100%', height: 400 }}> {/* Increased height slightly */}
          <ResponsiveContainer>
            <LineChart data={moodData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#aaa" tick={{fontSize: 12}} />
              <YAxis domain={[1, 5]} stroke="#aaa" ticks={[1, 2, 3, 4, 5]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#222', border: '1px solid #444', borderRadius: '8px', color: '#fff' }} 
                itemStyle={{ color: '#67e8f9' }}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#67e8f9" 
                strokeWidth={4} 
                dot={{ r: 5, fill: '#67e8f9', strokeWidth: 2, stroke: '#fff' }} 
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <p style={{textAlign:'center', marginTop: '20px', color: '#666', fontSize: '0.9rem'}}>
            (1 = Angry, 5 = Amazing)
          </p>
        </div>
      )}
    </div>
  );
};

const styles = {
  dashboardContainer: {
    padding: '40px 40px', // More padding
    background: 'rgba(26, 26, 46, 0.95)',
    borderRadius: '25px', 
    color: 'white', 
    marginTop: '40px',
    // 🟢 FIXED: Made it wider
    width: '90%', 
    maxWidth: '1200px', // Allow it to grow much larger
    margin: '40px auto', 
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    border: '1px solid rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)'
  },
  title: {
    textAlign: 'center', 
    color: '#67e8f9', 
    marginBottom: '40px', 
    fontSize: '2rem', // Bigger title
    letterSpacing: '1px'
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#aaa',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    fontSize: '1.1rem',
    marginBottom: '20px',
    transition: 'color 0.2s',
  },
  emptyState: {
    textAlign: 'center', 
    padding: '50px 20px', 
    color: 'white',
    border: '2px dashed #444',
    borderRadius: '15px'
  },
  actionBtn: {
    marginTop: '20px',
    padding: '10px 20px',
    background: 'transparent',
    border: '1px solid #67e8f9',
    color: '#67e8f9',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: '0.3s'
  }
};

export default MoodDashboard;