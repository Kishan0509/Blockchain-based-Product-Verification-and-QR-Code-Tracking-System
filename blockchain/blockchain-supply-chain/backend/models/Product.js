const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  serialNumber: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  manufacturer: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  history: [
    {
      role: { type: String, enum: ['manufacturer', 'supplier', 'retailer'] },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      transferredAt: Date
    }
  ]
});

module.exports = mongoose.model('Product', ProductSchema);