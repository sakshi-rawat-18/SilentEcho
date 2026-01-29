// server/models/Chat.js
const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  user: {
    type: String, 
    required: true, // Stores the username (e.g., "Sakshi")
  },
  message: {
    type: String,
    required: true,
  },
  sender: {
    type: String, // "user" or "bot"
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Chat', ChatSchema);