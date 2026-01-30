require('dotenv').config(); 
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose'); 
const { v4: uuidv4 } = require('uuid'); 
const { CohereClient } = require("cohere-ai");

const app = express();

// 🟢 FIX: THE "SAFE LIST" - EXACTLY MATCHING YOUR VERCEL URL
const allowedOrigins = [
  "https://silent-echo-six.vercel.app",  // Your Vercel App
  "http://localhost:3000"                  // Your Laptop
];

// 1. CORS for API Routes (Express)
app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "DELETE", "PUT"],
  credentials: true // 🟢 CRITICAL: Allows cookies/headers for the connection
}));

app.use(express.json());

// 2. CONNECT TO MONGODB 🍃
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MONGODB CONNECTED!"))
  .catch((err) => console.log("❌ DB Connection Error:", err));

const server = http.createServer(app);

// IMPORT MODELS
const Mood = require('./models/mood'); 
const Chat = require('./models/Chat'); 

// INITIALIZE COHERE AI
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY, 
});

// --- API ROUTES ---
app.post('/api/mood', async (req, res) => {
  try {
    const { emoji, note, score } = req.body;
    const newMood = new Mood({ emoji, note, score });
    await newMood.save();
    res.status(201).json({ message: "Mood Saved!", data: newMood });
  } catch (err) {
    res.status(500).json({ error: "Failed to save mood" });
  }
});

app.get('/api/moods', async (req, res) => {
  try {
    const moods = await Mood.find().sort({ timestamp: -1 });
    res.json(moods);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch moods" });
  }
});

app.get('/api/chat-history/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const history = await Chat.find({ user: username }).sort({ timestamp: 1 }).limit(50);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

app.post('/api/ai-chat', async (req, res) => {
  const { message, username } = req.body;
  try {
    if (!message) return res.status(400).json({ reply: "Message is required." });

    const userMsg = new Chat({ user: username || "Guest", message, sender: "user" });
    await userMsg.save();

    const response = await cohere.chat({
      message: message,
      preamble: "You are Nova, a helpful and kind mental health assistant. Keep answers short and empathetic.", 
      temperature: 0.3,
    });
    const botReply = response.text;
    const botMsg = new Chat({ user: username || "Guest", message: botReply, sender: "bot" });
    await botMsg.save();
    res.json({ reply: botReply });
  } catch (error) {
    console.error("❌ AI Error:", error);
    res.status(500).json({ reply: "I'm having a little trouble thinking. Ask me again? 💜" });
  }
});

app.delete('/api/chat/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Chat.findByIdAndDelete(id);
    res.json({ message: "Message deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete message" });
  }
});

app.delete('/api/chat-history/:username', async (req, res) => {
  try {
    const { username } = req.params;
    await Chat.deleteMany({ user: username });
    res.json({ message: "Chat history cleared!" });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear history" });
  }
});

// 3. SETUP SOCKET.IO 🔌
// 🟢 FIX: Apply the EXACT SAME CORS rules to the Socket
const io = new Server(server, {
  cors: {
    origin: allowedOrigins, // 🟢 Must match the list above
    methods: ["GET", "POST"],
    credentials: true // 🟢 CRITICAL
  },
});

let waitingUser = null; 

io.on("connection", (socket) => {
  console.log(`⚡: User Connected ${socket.id}`);

  socket.on("join_queue", (data) => {
    const userName = data?.name || "Stranger"; 
    if (waitingUser && waitingUser.socket.id === socket.id) return;

    if (waitingUser) {
      const roomId = uuidv4();
      const matchSocket = waitingUser.socket;
      const matchName = waitingUser.name;
      const matchSocketId = matchSocket.id; 
      
      matchSocket.join(roomId);
      socket.join(roomId);
      
      io.to(matchSocketId).emit("match_found", { roomId, partnerName: userName });
      io.to(socket.id).emit("match_found", { roomId, partnerName: matchName });
      
      waitingUser = null; 
    } else {
      waitingUser = { socket: socket, name: userName };
      console.log(`⏳ User ${userName} is waiting...`);
    }
  });

  socket.on("join_room", (roomId) => { socket.join(roomId); });
  socket.on("send_message", (data) => { socket.to(data.room).emit("receive_message", data); });
  
  socket.on("call_user", (data) => { 
      socket.to(data.roomId).emit("call_user", { signal: data.signalData, from: data.from });
  });

  socket.on("answer_call", (data) => {
      socket.to(data.roomId).emit("call_accepted", data.signal);
  });

  socket.on("call_ended", (data) => { io.to(data.roomId).emit("call_ended"); });
  socket.on("leave_room", (roomId) => { socket.to(roomId).emit("user_left"); socket.leave(roomId); });

  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => { socket.to(roomId).emit("user_left"); });
    if (waitingUser && waitingUser.socket.id === socket.id) { waitingUser = null; }
  });

  socket.on("disconnect", () => { console.log("🔥 User Disconnected"); });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ SERVER RUNNING ON PORT ${PORT}`);
});