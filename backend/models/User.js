const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: { type: String }, 
    googleId: { type: String }, 
    role: {type: String, enum: ['admin', 'manufacturer', 'supplier', 'retailer'], required: true}, 
    status: {type: String, enum: ['pending', 'approved', 'rejected', 'blocked', 'deleted'], default: 'pending'}
});

module.exports = mongoose.model('User', UserSchema);
