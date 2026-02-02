require('dotenv').config(); 
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose'); 
const { v4: uuidv4 } = require('uuid'); 
const { CohereClient } = require("cohere-ai");

const app = express();

// 🟢 NUCLEAR FIX: Allow "*" (Everyone) and DISABLE credentials
app.use(cors({
  origin: "*", 
  methods: ["GET", "POST", "DELETE", "PUT"],
  credentials: false // 🟢 MUST BE FALSE when origin is "*"
}));

app.use(express.json());

// 1. CONNECT TO MONGODB 🍃
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
    console.error(" AI Error:", error);
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

// 2. SETUP SOCKET.IO 🔌
// 🟢 NUCLEAR FIX: Apply "*" here too
const io = new Server(server, {
  cors: {
    origin: "*", // Allow anyone
    methods: ["GET", "POST"],
    credentials: false // 🟢 MUST BE FALSE
  },
});

let waitingUser = null; 

io.on("connection", (socket) => {
  console.log(`⚡: User Connected ${socket.id}`);

  // 🔥 UPDATED JOIN LOGIC WITH ID CHECK
  socket.on("join_queue", (data) => {
    const userName = data?.name || "Stranger";
    // 🔥 FIX: Ab ID bhi receive kar rahe hain (agar frontend bhej raha hai)
    // Agar purana frontend hai toh socket.id use karenge fallback ke liye
    const userId = data?.userId || socket.id; 

    // Case 1: Agar user pehle se wait kar raha hai (Refresh/Re-click kiya)
    if (waitingUser && waitingUser.socket.id === socket.id) return;
    
    // Case 2: Agar same User ID (Tab A) doosre Tab (Tab B) se connect karne ki koshish kare
    if (waitingUser && waitingUser.userId === userId) {
        console.log("⚠️ Same user tried to connect with themselves. Waiting for someone else.");
        return; 
    }

    if (waitingUser) {
      // ✅ MATCH FOUND
      const roomId = uuidv4();
      const matchSocket = waitingUser.socket;
      const matchName = waitingUser.name;
      const matchSocketId = matchSocket.id; 
      
      // Dono ko room mein daalo
      matchSocket.join(roomId);
      socket.join(roomId);
      
      // Notification bhejo
      io.to(matchSocketId).emit("match_found", { roomId, partnerName: userName });
      io.to(socket.id).emit("match_found", { roomId, partnerName: matchName });
      
      waitingUser = null; // Queue reset
    } else {
      // ⏳ NO ONE WAITING -> ADD TO QUEUE
      waitingUser = { 
          socket: socket, 
          name: userName,
          userId: userId // Store ID for safety check
      };
      console.log(`⏳ User ${userName} (ID: ${userId}) is waiting...`);
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