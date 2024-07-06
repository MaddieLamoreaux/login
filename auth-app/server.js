const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const port = 3000; // Set to port 3000

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Define User schema and model
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    email: { type: String, unique: true },
    password: String
});
const User = mongoose.model('User', userSchema);

app.use(bodyParser.json());
app.use(express.static('public'));

// Register route
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = new User({ username, email, password: hashedPassword });

    try {
        await user.save();
        const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET);
        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user' });
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
