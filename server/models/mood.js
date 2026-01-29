// server/models/Mood.js
const mongoose = require('mongoose');

const MoodSchema = new mongoose.Schema({
  emoji: {
    type: String,
    required: true, 
  },
  note: {
    type: String, // Optional note like "Had a great exam"
  },
  score: {
    type: Number, // e.g., 1 (Sad) to 5 (Happy) for graphing
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now, // Automatically saves the current time
  }
});

module.exports = mongoose.model('Mood', MoodSchema);