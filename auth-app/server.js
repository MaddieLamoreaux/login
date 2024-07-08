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

// Define Post schema and model
const postSchema = new mongoose.Schema({
    username: String,
    content: String,
    createdAt: { type: Date, default: Date.now },
    likes: { type: Number, default: 0 }
});
const Post = mongoose.model('Post', postSchema);

// CORS Middleware for handling cross-origin requests
app.use(cors());

// Middleware for JSON body parsing
app.use(bodyParser.json());

// Static files
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
        console.error('Registration error:', error);
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
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error logging in' });
    }
});

// Posts route
app.get('/posts', authenticateToken, async (req, res) => {
    try {
        const posts = await Post.find({ username: req.user.username }).sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ message: 'Error fetching posts' });
    }
});

app.post('/posts', authenticateToken, async (req, res) => {
    const newPost = new Post({ username: req.user.username, content: req.body.content });
    try {
        await newPost.save();
        res.status(201).json(newPost);
    } catch (error) {
        console.error('Error saving post:', error);
        res.status(500).json({ message: 'Error saving post' });
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
