import CryptoJS from 'crypto-js';

// 🔐 THE MASTER KEY
// In a real app, this would be complex. For now, we use a shared secret.
const SECRET_KEY = "silent-echo-secure-key"; 

export const encryptMessage = (text) => {
  if (!text) return "";
  // Encrypt the text
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
};

export const decryptMessage = (cipherText) => {
  if (!cipherText) return "";
  try {
    // Decrypt the text
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText;
  } catch (error) {
    return "🔒 Encrypted Message"; // If decryption fails
  }
};