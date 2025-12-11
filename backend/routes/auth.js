const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs-extra');
const { encryptPassword, decryptPassword, getUsersDB, saveUsersDB } = require('../utils/encryption');

// Register a new user
router.post('/signup', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    // Validation
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    // Get users database
    const usersDB = getUsersDB();
    
    // Check if username already exists
    if (usersDB[username]) {
      return res.status(409).json({ message: 'Username already exists' });
    }
    
    // Create new user
    const userId = uuidv4();
    const encryptedPassword = encryptPassword(password);
    
    usersDB[username] = {
      id: userId,
      username,
      password: encryptedPassword,
      email: email || '',
      createdAt: new Date().toISOString()
    };
    
    // Save updated users database
    saveUsersDB(usersDB);
    
    // Create user storage directory
    const userStorageDir = path.join(__dirname, '../storage', username);
    fs.ensureDirSync(userStorageDir);
    
    // Set session
    req.session.userId = userId;
    req.session.username = username;
    
    res.status(201).json({ 
      message: 'User registered successfully',
      user: {
        id: userId,
        username,
        email: email || ''
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validation
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    // Get users database
    const usersDB = getUsersDB();
    
    // Check if user exists
    if (!usersDB[username]) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Verify password
    const decryptedPassword = decryptPassword(usersDB[username].password);
    if (password !== decryptedPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Set session
    req.session.userId = usersDB[username].id;
    req.session.username = username;
    
    res.status(200).json({ 
      message: 'Login successful',
      user: {
        id: usersDB[username].id,
        username,
        email: usersDB[username].email || ''
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Logout user
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Could not log out' });
    }
    res.status(200).json({ message: 'Logout successful' });
  });
});

// Check if user is logged in
router.get('/status', (req, res) => {
  if (req.session && req.session.userId) {
    return res.status(200).json({ 
      loggedIn: true,
      user: {
        id: req.session.userId,
        username: req.session.username
      }
    });
  }
  res.status(200).json({ loggedIn: false });
});

module.exports = router;
