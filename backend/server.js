require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Web3 = require("web3");
const fs = require("fs");
const path = require("path");
const helmet = require("helmet");
const morgan = require("morgan");
const QRCode = require("qrcode"); 
const passport = require("passport");
const session = require("express-session");
const jwt = require('jsonwebtoken');

const authRoutes = require('./routes/authRoutes');
const Product = require('./models/Product');

require("./config/passport")
const connectDB = require('./config/db');
connectDB();

const requiredEnv = ["CONTRACT_ADDRESS"];       
requiredEnv.forEach((key) => {
    if (!process.env[key]) {
        console.error(`❌ Missing required environment variable: ${key}`);
        process.exit(1);
    }
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: "http://localhost:3001", 
    credentials: true 
}));

app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));
app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(authRoutes);

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.RPC_URL));

// ✅ Load Smart Contract ABI
const contractPath = path.join(__dirname, "contractABI.json");
if (!fs.existsSync(contractPath)) {
    console.error("❌ contractABI.json file is missing!");
    process.exit(1);
}
const contractABI = JSON.parse(fs.readFileSync(contractPath, "utf8")).abi;
const contractAddress = process.env.CONTRACT_ADDRESS;

const contract = new web3.eth.Contract(contractABI, contractAddress);

// ✅ QR Code Storage Directory
const qrCodeFolder = path.join(__dirname, "qr_codes");
if (!fs.existsSync(qrCodeFolder)) {
    fs.mkdirSync(qrCodeFolder, { recursive: true });
}

// ✅ Serve QR Codes as Static Files
app.use("/qr_codes", express.static(qrCodeFolder));

// ✅ Default API Check
app.get("/", (req, res) => {
    res.send("🚀 Blockchain API is running on Amoy Testnet!");
});

// ✅ API: Store QR Codes (Fix for 404 error)
app.post("/api/storeQRCodes", async (req, res) => {
    try {
        const { qrData } = req.body;
        if (!qrData || !Array.isArray(qrData) || qrData.length === 0) {
            return res.status(400).json({ success: false, message: "❌ No QR data provided!" });
        }

        for (const { serial, qr } of qrData) {
            const qrFilePath = path.join(qrCodeFolder, `QR_${serial}.png`);
            await QRCode.toFile(qrFilePath, qr);
        }

        res.json({ success: true, message: "✅ QR Codes stored successfully!" });
    } catch (error) {
        console.error("❌ Error storing QR Codes:", error);
        res.status(500).json({ success: false, message: "❌ Failed to store QR Codes." });
    }
});


app.post("/api/register", async (req, res, next) => {
    try {
        const token = req.headers['x-auth-token'];
        if (!token) return res.status(401).json({ message: "Access Denied" });

        const user = jwt.verify(token, process.env.JWT_SECRET);
        if (user.role !== 'manufacturer') {
            return res.status(403).json({ message: "Only manufacturers can register products" });
        }

        const { products } = req.body;

        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ success: false, message: "❌ No products provided!" });
        }

        let savedProducts = [];
        let failedProducts = [];

        for (const product of products) {
            const { serialNumber, name, manufacturer } = product;

            if (!serialNumber || !name || !manufacturer) {
                failedProducts.push(serialNumber || "unknown");
                continue;
            }

            const newProduct = new Product({
                serialNumber,
                name,
                manufacturer: user.name, // from JWT
                timestamp: new Date(),
                history: [{
                    role: "manufacturer",
                    userId: user.id,
                    transferredAt: new Date()
                }]
            });

            try {
                await newProduct.save();
                savedProducts.push(serialNumber);
            } catch (err) {
                console.warn(`⚠️ Failed to save ${serialNumber}:`, err.message);
                failedProducts.push(serialNumber);
            }
        }

        res.json({
            success: true,
            savedProducts,
            failedProducts,
            message: `✅ ${savedProducts.length} product(s) saved. ⚠️ ${failedProducts.length} failed.`
        });
    } catch (error) {
        console.error("❌ Error registering product:", error);
        next(error);
    }
});


// ✅ API: Update Product History (used by UpdateStatus page)
app.post("/api/updateHistory", async (req, res) => {
  try {
    const { serialNumber, role, userId, userName } = req.body;

    if (!serialNumber || !role || !userName) {
      return res.status(400).json({ success: false, message: "❌ Missing required fields." });
    }

    // const product = await Product.findOne({ serialNumber });
    const product = await Product.findOne({ serialNumber }).populate('history.userId', 'name');
    if (!product) {
      return res.status(404).json({ success: false, message: "❌ Product not found." });
    }

    product.history.push({
      role,
      userId: userId || null,
      transferredAt: new Date()
    });

    await product.save();

    res.json({ success: true, message: "✅ Product history updated successfully." });
  } catch (error) {
    console.error("❌ Error updating product history:", error);
    res.status(500).json({ success: false, message: "❌ Server error" });
  }
});


app.get("/api/getProduct/:serialNumber", async (req, res, next) => {
  try {
    const serialNumber = req.params.serialNumber;

    const productOnChain = await contract.methods.getProductDetails(serialNumber).call();
    const productInDB = await Product.findOne({ serialNumber }).populate("history.userId", "name");

    if (!productOnChain || productOnChain[0] === "") {
      return res.status(404).json({ success: false, message: "❌ Product not found!" });
    }

    res.json({
      success: true,
      data: {
        name: productOnChain[0],
        manufacturer: productOnChain[1],
        serialNumber: productOnChain[2],
        status: productOnChain[3],
        timestamp: productOnChain[4] * 1000,
        owner: productOnChain[5],
        qrCodeUrl: `http://localhost:${PORT}/qr_codes/QR_${serialNumber}.png`,
        history: productInDB?.history || [],
      },
    });
  } catch (error) {
    console.error("❌ Error Fetching Product:", error);
    next(error);
  }
});



app.use('/api/auth', authRoutes);

app.use("/api/admin", require("./routes/adminRoutes"));

app.use('/api/user', require('./routes/userRoutes'));


// ✅ Centralized Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("🚨 API Error:", err);
    res.status(500).json({ success: false, message: err.message, error: err.stack });
});

app.listen(PORT, () => {
    console.log(`🚀 Blockchain API is running on http://localhost:${PORT}`);
});