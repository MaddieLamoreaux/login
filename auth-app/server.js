const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
    app.locals.dbConnected = true;
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    app.locals.dbConnected = false;
  });

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Define User schema and model
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// Register route
app.post('/register', async (req, res) => {
  if (!app.locals.dbConnected) {
    return res.status(503).json({ message: 'Database not available, try using offline mode.' });
  }

  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, email, password: hashedPassword });

  try {
    await user.save();
    const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET);
    res.status(201).json({ token });
  } catch (error) {
    if (error.code === 11000) {
      res.status(409).json({ message: 'Username or email already exists' });
    } else {
      console.error('Error registering user:', error);
      res.status(500).json({ message: 'Error registering user' });
    }
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Cannot find user' });
    if (!bcrypt.compareSync(password, user.password)) return res.status(403).json({ message: 'Incorrect password' });

    const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Dashboard route
app.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    res.json({ username: user.username });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard' });
  }
});

// Profile route
app.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    res.json({ username: user.username, email: user.email });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Token authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
