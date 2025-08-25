// server.js - Main Server
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const stripe = require('stripe');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Stripe
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = './uploads';
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});

// Database setup
const db = new sqlite3.Database('./proptech.db');

// Initialize database tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    credits INTEGER DEFAULT 5,
    subscription_status TEXT DEFAULT 'trial',
    stripe_customer_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Documents table
  db.run(`CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    analysis_result TEXT,
    credits_used INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Transactions table
  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    description TEXT,
    stripe_payment_intent_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);
});

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// OpenAI Analysis Function
async function analyzeDocumentWithAI(text) {
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [{
        role: 'system',
        content: 'You are a real estate document analyzer. Extract key information from property documents and return structured JSON.'
      }, {
        role: 'user',
        content: `Analyze this real estate document and extract key information in JSON format:

Text: ${text}

Please extract:
- property_address
- owner_name
- property_type
- price (if mentioned)
- key_dates
- important_clauses
- document_type
- summary

Return only valid JSON.`
      }],
      max_tokens: 1000,
      temperature: 0.3
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return JSON.parse(response.data.choices[0].message.content);
  } catch (error) {
    console.error('OpenAI API error:', error.response?.data || error.message);
    
    // Fallback analysis if OpenAI fails
    return {
      property_address: "Analysis unavailable",
      owner_name: "Analysis unavailable", 
      property_type: "Analysis unavailable",
      price: "Analysis unavailable",
      key_dates: [],
      important_clauses: [],
      document_type: "PDF Document",
      summary: "Document uploaded successfully. AI analysis temporarily unavailable.",
      fallback: true
    };
  }
}

// Routes

// Auth Routes
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create Stripe customer
    const customer = await stripeClient.customers.create({
      email: email,
      name: name
    });

    db.run(
      'INSERT INTO users (email, password, name, stripe_customer_id) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, name, customer.id],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email already registered' });
          }
          return res.status(500).json({ error: 'Registration failed' });
        }
        
        const token = jwt.sign(
          { userId: this.lastID, email },
          process.env.JWT_SECRET || 'fallback_secret',
          { expiresIn: '7d' }
        );
        
        res.json({ 
          token, 
          user: { id: this.lastID, email, name, credits: 5 },
          message: 'Registration successful! You have 5 free credits to start.'
        });
      }
    );
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err || !user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );
    
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        credits: user.credits,
        subscription_status: user.subscription_status
      }
    });
  });
});

// User Profile
app.get('/api/profile', authenticateToken, (req, res) => {
  db.get(
    'SELECT id, email, name, credits, subscription_status FROM users WHERE id = ?',
    [req.user.userId],
    (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ user });
    }
  );
});

// Document Analysis
app.post('/api/analyze', authenticateToken, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check user credits
    db.get('SELECT credits FROM users WHERE id = ?', [req.user.userId], async (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.credits < 1) {
        return res.status(400).json({ error: 'Insufficient credits. Please purchase more credits.' });
      }

      try {
        // Parse PDF
        const pdfBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdfParse(pdfBuffer);
        
        // Analyze with AI
        const analysis = await analyzeDocumentWithAI(pdfData.text);
        
        // Save to database and deduct credit
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');
          
          db.run(
            'INSERT INTO documents (user_id, filename, original_name, analysis_result) VALUES (?, ?, ?, ?)',
            [req.user.userId, req.file.filename, req.file.originalname, JSON.stringify(analysis)]
          );
          
          db.run(
            'UPDATE users SET credits = credits - 1 WHERE id = ?',
            [req.user.userId]
          );
          
          db.run(
            'INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)',
            [req.user.userId, 'credit_used', -1, 'Document analysis']
          );
          
          db.run('COMMIT');
        });

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        
        res.json({ 
          analysis,
          creditsRemaining: user.credits - 1,
          message: 'Document analyzed successfully!'
        });
        
      } catch (analysisError) {
        console.error('Analysis error:', analysisError);
        fs.unlinkSync(req.file.path);
        res.status(500).json({ error: 'Analysis failed. Please try again.' });
      }
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Get user documents
app.get('/api/documents', authenticateToken, (req, res) => {
  db.all(
    'SELECT id, original_name, analysis_result, created_at FROM documents WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.userId],
    (err, documents) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch documents' });
      }
      
      const processedDocs = documents.map(doc => ({
        ...doc,
        analysis_result: JSON.parse(doc.analysis_result)
      }));
      
      res.json({ documents: processedDocs });
    }
  );
});

// Payment Routes
app.post('/api/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    const { amount, credits } = req.body; // amount in cents
    
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: amount,
      currency: 'eur',
      customer: req.user.stripe_customer_id,
      metadata: {
        userId: req.user.userId.toString(),
        credits: credits.toString()
      }
    });
    
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ error: 'Payment failed' });
  }
});

app.post('/api/confirm-payment', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId, credits } = req.body;
    
    const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      // Add credits to user
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        db.run(
          'UPDATE users SET credits = credits + ? WHERE id = ?',
          [credits, req.user.userId]
        );
        
        db.run(
          'INSERT INTO transactions (user_id, type, amount, description, stripe_payment_intent_id) VALUES (?, ?, ?, ?, ?)',
          [req.user.userId, 'credit_purchase', credits, `Purchased ${credits} credits`, paymentIntentId]
        );
        
        db.run('COMMIT');
      });
      
      res.json({ success: true, message: `${credits} credits added successfully!` });
    } else {
      res.status(400).json({ error: 'Payment not successful' });
    }
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ error: 'Payment confirmation failed' });
  }
});

// Serve static files
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 PropTech MVP Server running on port ${PORT}`);
  console.log('📁 Upload folder: ./uploads');
  console.log('💾 Database: ./proptech.db');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('💾 Database connection closed.');
    }
    process.exit(0);
  });
});
