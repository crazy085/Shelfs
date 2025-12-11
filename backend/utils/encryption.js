const CryptoJS = require('crypto-js');
const fs = require('fs-extra');
const path = require('path');

// Get encryption key from environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';

/**
 * Encrypts a password using AES-256
 * @param {string} password - The password to encrypt
 * @returns {string} - The encrypted password
 */
function encryptPassword(password) {
  const encrypted = CryptoJS.AES.encrypt(password, ENCRYPTION_KEY).toString();
  return encrypted;
}

/**
 * Decrypts a password using AES-256
 * @param {string} encryptedPassword - The encrypted password
 * @returns {string} - The decrypted password
 */
function decryptPassword(encryptedPassword) {
  const bytes = CryptoJS.AES.decrypt(encryptedPassword, ENCRYPTION_KEY);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  return decrypted;
}

/**
 * Reads and decrypts the users database
 * @returns {Object} - The users database
 */
function getUsersDB() {
  const usersFile = path.join(__dirname, '../users.enc');
  
  if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, '{}');
    return {};
  }
  
  try {
    const encryptedData = fs.readFileSync(usersFile, 'utf8');
    if (!encryptedData || encryptedData === '{}') {
      return {};
    }
    
    const decryptedData = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedData);
  } catch (error) {
    console.error('Error reading users database:', error);
    return {};
  }
}

/**
 * Encrypts and saves the users database
 * @param {Object} usersDB - The users database to save
 */
function saveUsersDB(usersDB) {
  const usersFile = path.join(__dirname, '../users.enc');
  const dataStr = JSON.stringify(usersDB);
  const encryptedData = CryptoJS.AES.encrypt(dataStr, ENCRYPTION_KEY).toString();
  fs.writeFileSync(usersFile, encryptedData);
}

module.exports = {
  encryptPassword,
  decryptPassword,
  getUsersDB,
  saveUsersDB
};
