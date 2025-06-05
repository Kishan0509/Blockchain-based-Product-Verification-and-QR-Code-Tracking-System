const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const dotenv = require('dotenv');
const passport = require('passport');
const { OAuth2Client } = require("google-auth-library");

dotenv.config();
const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// **User Registration**
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        user = new User({ name, email, password: hashedPassword, role });

        await user.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// **User Login**
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        if(user.status !== 'approved'){
            return res.status(403).json({message: "Your account is not approved yet"})
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ name: user.name, id: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// **Protected Route Example**
router.get('/profile', async (req, res) => {
    try {
        const token = req.headers["x-auth-token"];
        if (!token) return res.status(401).json({ message: "Access Denied" });

        const verified = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(verified.id).select('-password');

        res.json(user);
    } catch (err) {
        res.status(500).json({ message: "Invalid Token" });
    }
});


// POST /api/auth/google
router.post("/google", async (req, res) => {
    try {
        const { token } = req.body;

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name, sub: googleId } = payload;

        let user = await User.findOne({ email });

        // ✅ User exists, check if approved
        if (user) {
            if (user.status !== 'approved') {
                return res.status(403).json({ message: "Your account is not approved yet." });
            }

            const jwtToken = jwt.sign(
                { name: user.name, id: user._id, role: user.role, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );

            return res.json({ token: jwtToken, user });
        }

        // 🆕 New Google user – prompt for role
        return res.status(200).json({
            newUser: true,
            name,
            email,
            googleId
        });

    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(400).json({ message: "Google authentication failed." });
    }
});

// POST /api/auth/google/register
router.post("/google/register", async (req, res) => {
    const { name, email, googleId, role } = req.body;

    if (!name || !email || !googleId || !role) {
        return res.status(400).json({ message: "Missing required fields." });
    }

    try {
        let existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: "User already exists." });
        }

        const user = new User({
            name,
            email,
            googleId,
            role,
            status: "pending"
        });

        await user.save();

        return res.status(201).json({ message: "Account created. Awaiting approval." });
    } catch (error) {
        console.error("Google Registration Error:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
});


// Change Password Route
router.post('/change-password', async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const token = req.headers['x-auth-token'];

    if (!token) return res.status(401).json({ message: 'Access Denied' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(verified.id);

        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Old password is incorrect' });

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedNewPassword;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update Profile (Name)
router.put('/update-profile', async (req, res) => {
    const { name } = req.body;
    const token = req.headers['x-auth-token'];

    if (!token) return res.status(401).json({ message: 'Access Denied' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(verified.id);

        if (!user) return res.status(404).json({ message: 'User not found' });

        if (name) user.name = name;

        await user.save();

        res.json({ message: 'Profile updated successfully', user: { name: user.name } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

