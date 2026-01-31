import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// 🟢 YOUR FIREBASE CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyAn1pb5lBd3N93IijjjsDuxeibnnf59Krc",
  authDomain: "silentecho-6522a.firebaseapp.com",
  databaseURL: "https://silentecho-6522a-default-rtdb.firebaseio.com",
  projectId: "silentecho-6522a",
  storageBucket: "silentecho-6522a.firebasestorage.app",
  messagingSenderId: "983525908308",
  appId: "1:983525908308:web:8dcc78d23f1adc2ebf32c1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and export it
export const db = getDatabase(app);