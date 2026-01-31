import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage'; 
import Lobby from './components/Lobby';
// Note: WaitingRoom hata diya kyunki ab hum ChatRoom mein hi waiting dikha rahe hain
import ChatRoom from './components/Chatroom'; // ⚠️ Check spelling: ChatRoom vs Chatroom
import MoodTracker from './components/MoodTracker';
import NovaAI from './components/NovaAI';
import MoodDashboard from './components/MoodDashboard'; 
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* Default Home Page */}
          <Route path="/" element={<LandingPage />} />
          
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/chat" element={<ChatRoom />} />
          
          {/* 🟢 FIXED: AB YE NAAM LOBBY SE MATCH KARENGE */}
          <Route path="/mood-tracker" element={<MoodTracker />} />  {/* Pehle /mood tha */}
          <Route path="/nova" element={<NovaAI />} />               {/* Pehle /ai tha */}
          <Route path="/dashboard" element={<MoodDashboard />} />   {/* Pehle /analytics tha */}
          
        </Routes>
      </div>
    </Router>
  );
}

export default App;