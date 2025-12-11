const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { isAuthenticated } = require('../utils/middleware');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(__dirname, '../storage', req.session.username);
    fs.ensureDirSync(userDir);
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename to avoid conflicts
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Get user's files
router.get('/list', isAuthenticated, async (req, res) => {
  try {
    const userDir = path.join(__dirname, '../storage', req.session.username);
    
    if (!fs.existsSync(userDir)) {
      return res.status(200).json({ files: [] });
    }
    
    const files = await fs.readdir(userDir);
    const fileList = [];
    
    for (const file of files) {
      const filePath = path.join(userDir, file);
      const stats = await fs.stat(filePath);
      
      fileList.push({
        name: file,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        type: path.extname(file).substring(1) || 'unknown'
      });
    }
    
    res.status(200).json({ files: fileList });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Upload file
router.post('/upload', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const fileInfo = {
      name: req.file.originalname,
      storedName: req.file.filename,
      size: req.file.size,
      type: path.extname(req.file.originalname).substring(1) || 'unknown'
    };
    
    res.status(201).json({ 
      message: 'File uploaded successfully',
      file: fileInfo
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Download file
router.get('/download/:filename', isAuthenticated, async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../storage', req.session.username, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ message: 'Error downloading file' });
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete file
router.delete('/:filename', isAuthenticated, async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../storage', req.session.username, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    await fs.remove(filePath);
    
    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get file preview (for images, text files, etc.)
router.get('/preview/:filename', isAuthenticated, async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../storage', req.session.username, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    const ext = path.extname(filename).toLowerCase();
    
    // Set appropriate content type based on file extension
    if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(ext)) {
      res.type('image');
    } else if (ext === '.pdf') {
      res.type('pdf');
    } else if (['.txt', '.md', '.json', '.xml', '.csv'].includes(ext)) {
      res.type('text');
    } else {
      return res.status(400).json({ message: 'Preview not supported for this file type' });
    }
    
    res.sendFile(filePath);
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
