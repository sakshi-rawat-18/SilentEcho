import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage'; 
import Lobby from './components/Lobby';
import WaitingRoom from './components/WaitingRoom';
import ChatRoom from './components/Chatroom';
import MoodTracker from './components/MoodTracker';
import NovaAI from './components/NovaAI';
import MoodDashboard from './components/MoodDashboard'; // Ensure this path is correct
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* Default Home Page */}
          <Route path="/" element={<LandingPage />} />
          
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/wait" element={<WaitingRoom />} />
          <Route path="/chat" element={<ChatRoom />} />
          <Route path="/mood" element={<MoodTracker />} />
          <Route path="/ai" element={<NovaAI />} />
          
          {/* 🟢 FIXED: Changed path from "/" back to "/analytics" */}
          <Route path="/analytics" element={<MoodDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;