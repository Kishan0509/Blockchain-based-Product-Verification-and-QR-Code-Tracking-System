const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const jwt = require('jsonwebtoken');
const router = express.Router();
const bcrypt = require('bcryptjs');

// Middleware to verify token and admin
function verifyAdmin(req, res, next) {
    const token = req.headers["x-auth-token"];
    if (!token) return res.status(401).json({ message: "Access denied" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== "admin") {
            return res.status(403).json({ message: "Access forbidden: Admins only" });
        }
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid or expired token" });
    }
}

// 📌 Admin route to get all users
router.get('/users', verifyAdmin, async (req, res) => {
    try {
        const users = await User.find({}, { password: 0 }); 
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

//Approve user
router.post('/approve/:id', verifyAdmin, async(req, res) => {
    try{
        const  user = await User.findByIdAndUpdate(req.params.id, {status: 'approved'}, {new: true});
        if(!user) return res.status(404).json({message: "User not found"});
        res.json({success: true, message: "User approved", user});
    } catch (err){
        res.status(500).json({message: "Server error"});
    }
});

//Reject user
router.post('/reject/:id', verifyAdmin, async(req, res) => {
    try{
        const user = await User.findByIdAndUpdate(req.params.id, {status: 'rejected'}, {new: true});
        if(!user) return res.status(404).json({message: "User not found"});
        res.json({success: true, message: "user rejected", user});
    } catch (err) {
        res.status(500).json({message: "Server error"});
    }
});


// Block user
router.post('/block/:id', verifyAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { status: 'blocked' }, { new: true });
        if (!user) return res.status(404).json({ message: "User  not found" });
        res.json({ success: true, message: "User  blocked", user });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// Delete user
router.delete('/delete/:id', verifyAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: "User  not found" });
        res.json({ success: true, message: "User  deleted" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});



// Add new admin
router.post('/add', verifyAdmin, async (req, res) => {
    const { name, email, password, role } = req.body;
    console.log("Request body:", req.body);

    try {
        // Check if the user already exists
        let existingUser  = await User.findOne({ email });
        if (existingUser ) {
            return res.status(400).json({ message: "User  already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser  = new User({
            name,
            email,
            password: hashedPassword,
            role,
            status: 'approved' 
        });

        await newUser .save();
        res.status(201).json({ user: newUser  });
    } catch (err) {
        console.error("Error adding admin:", err); 
        res.status(500).json({ message: "Server error" });
    }
});


router.get('/dashboard', verifyAdmin, async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const productCount = await Product.countDocuments();

        res.json({
            success: true,
            userCount,
            productCount,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error"});
    }
});

router.get('/users/count', async (req, res) => {
    try {
        const count = await User.countDocuments();
        res.json({ count });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get total number of products
router.get('/products/count', async (req, res) => {
    try {
        const count = await Product.countDocuments();
        res.json({ count });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Count by role
router.get('/users/count-by-role', async (req, res) => {
    try {
        const [manufacturers, suppliers, retailers] = await Promise.all([
            User.countDocuments({ role: 'manufacturer' }),
            User.countDocuments({ role: 'supplier' }),
            User.countDocuments({ role: 'retailer' })
        ]);
        res.json({ manufacturers, suppliers, retailers });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});


// Product count by registration date (for chart)
router.get('/products/registered-dates', async (req, res) => {
    try {
        const data = await Product.aggregate([
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get list of users by role
router.get('/users/list/:role', async (req, res) => {
    try {
        const { role } = req.params;
        const allowedRoles = ['manufacturer', 'supplier', 'retailer'];

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ message: "Invalid role" });
        }

        const users = await User.find({ role }).select('name email status');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get list of all products
router.get('/products/list', async (req, res) => {
    try {
        const products = await Product.find().select('serialNumber name manufacturer quantity timestamp');
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});


module.exports = router;