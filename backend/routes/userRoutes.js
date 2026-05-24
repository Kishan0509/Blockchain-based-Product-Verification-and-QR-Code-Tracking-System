const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const jwt = require("jsonwebtoken");
const mongoose = require('mongoose');

// Middleware: Verify user token and role
function verifyUser(req, res, next) {
  const token = req.headers["x-auth-token"];
  if (!token) return res.status(401).json({ message: "Access denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

// Get user's own products (Manufacturer, Supplier, Retailer)
router.get("/products", verifyUser, async (req, res) => {
  try {
    const { role, name, id } = req.user;
    let products;

    if (role === "manufacturer") {
      products = await Product.find({
        history: { $elemMatch: { role: "manufacturer", userId: id } },
      });
    } else if (role === "supplier") {
      products = await Product.find({
        history: { $elemMatch: { role: "supplier", userId: id } },
      });
    } else if (role === "retailer") {
      products = await Product.find({
        history: { $elemMatch: { role: "retailer", userId: id } },
      });
    } else {
      return res
        .status(403)
        .json({ message: "Access forbidden: Invalid role" });
    }

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


router.get('/dashboard', verifyUser, async (req, res) => {
  try {
    const { role, id, name } = req.user;
    const userProducts = await Product.find({
      history: { $elemMatch: { role: role, userId: id } }
    });

    const totalProducts = userProducts.length;

    const response = {
      role,
      totalProducts
    };

    if (role === 'manufacturer') {
      let updatedBySupplier = 0;

      userProducts.forEach(product => {
        if (product.history.some(h => h.role === 'supplier')) {
          updatedBySupplier++;
        }
      });

      response.updatedBySupplier = updatedBySupplier;
      response.notUpdatedBySupplier = totalProducts - updatedBySupplier;

    } else if (role === 'supplier') {
      let updatedByRetailer = 0;

      userProducts.forEach(product => {
        if (product.history.some(h => h.role === 'retailer')) {
          updatedByRetailer++;
        }
      });

      response.updatedByRetailer = updatedByRetailer;
      response.notUpdatedByRetailer = totalProducts - updatedByRetailer;

    } else if (role === 'retailer') {
      response.totalProducts = userProducts.length;
    } else {
      return res.status(403).json({ message: 'Access forbidden: Invalid role' });
    }

    res.json(response);
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// Handle transferring products between roles (manufacturer -> supplier -> retailer)
router.post("/transfer", verifyUser, async (req, res) => {
  const { serialNumber, nextRole } = req.body;
  const allowedTransitions = {
    manufacturer: "supplier",
    supplier: "retailer",
  };

  try {
    const product = await Product.findOne({ serialNumber });
    if (!product) return res.status(404).json({ message: "Product not found" });

    const lastEntry = product.history[product.history.length - 1];
    if (
      lastEntry.role !== req.user.role ||
      lastEntry.userId.toString() !== req.user.id// lastEntry.userName !== req.user.name
    ) {
      return res
        .status(403)
        .json({ message: "You're not authorized to transfer this product" });
    }

    const expectedNextRole = allowedTransitions[req.user.role];
    if (expectedNextRole !== nextRole) {
      return res
        .status(400)
        .json({ message: `Invalid next role. Expected: ${expectedNextRole}` });
    }

    product.history.push({
      role: nextRole,
      userId: req.user.id, //req.user.name
      transferredAt: new Date(),
    });

    await product.save();
    res.json({
      success: true,
      message: "Product transferred successfully",
      history: product.history,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 📊 Registered product count per date (e.g., for manufacturers, track registrations)
router.get("/registered-dates", verifyUser, async (req, res) => {
  try {
    const { role, id } = req.user;

    if (!['manufacturer', 'supplier', 'retailer'].includes(role)) {
      return res.status(403).json({ message: "Access forbidden: Manufacturers only" });
    }

    const data = await Product.aggregate([
      { $unwind: "$history" },
      {
        $match: {
          "history.role": role,
          "history.userId": new mongoose.Types.ObjectId(id),
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$history.transferredAt",
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(data);
  } catch (err) {
    console.error("Error fetching chart data:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
