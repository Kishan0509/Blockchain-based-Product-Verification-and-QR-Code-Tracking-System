
# Blockchain based Product Verification and QR Code Tracking System

This project is a Blockchain-Based Supply Chain Management and Product Verification System designed to ensure transparency, authenticity, and traceability of products throughout their lifecycle. It enables manufacturers, suppliers, and retailers to register, verify, and update product information securely using blockchain technology.

Each product is assigned a unique QR code, which allows users to track its movement and verify authenticity at any stage of the supply chain. The system uses smart contracts deployed on the Polygon testnet to record all transactions immutably.

The platform includes role-based access control for different users (Admin, Manufacturer, Supplier, Retailer), an admin approval system, and data encryption for privacy. It also provides a dashboard with real-time analytics for monitoring user and product activity.




## Features

- 🔐 Blockchain-based product registration and verification
- 🏷️ Unique QR code generation for each registered product
- 👥 Role-based access control (Admin, Manufacturer, Supplier, Retailer)
- 📊 Real-time analytics dashboard using Chart.js
- 🧠 MetaMask integration for secure transaction signing
- 🔒 Data encryption using CryptoJS before blockchain storage
- 🧾 Authentication using JWT, bcrypt.js, and Google OAuth 2.0
- 📦 Bulk product registration with quantity-based QR code generation


## Tech Stack

**Frontend:** React.js, HTML, CSS, JavaScript

**Backend:** Node.js, Express.js

**Database:** MongoDB

**Blockchain:** Solidity, Truffle, Web3.js, MetaMask, Polygon Testnet, Infura, Alchemy

**Security:** JWT, bcrypt.js, CryptoJS

**Visualization:** Chart.js

**Other Tools:** PolygonScan API, QR Code Generator/Scanner


## Installation & Setup

Clone the repository:

```bash
  git clone https://github.com/your-username/your-project-name.git
  cd your-project-name
```

Install dependencies:

```bash
  npm install
```

Set up environment variables:

```bash
  MONGO_URI=your_mongodb_connection_string
  JWT_SECRET=your_jwt_secret
  INFURA_API_KEY=your_infura_api_key
  ALCHEMY_API_KEY=your_alchemy_api_key
  POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

Start the application:

```bash
  npm start
```

Install dependencies:

```bash
  git clone https://github.com/your-username/your-project-name.git
  cd your-project-name
```

Install dependencies:

```bash
  git clone https://github.com/your-username/your-project-name.git
  cd your-project-name
```
    
## Usage

1. Register or log in as a user (Admin, Manufacturer, Supplier, Retailer).

2. Admin must approve new users before they can access the system.

3. Register products by entering details and selecting quantity — the system generates unique QR codes.

4. Verify or update product status by scanning the QR code.

5. View analytics on the dashboard for product and user statistics.


## Security Highlights
End-to-end data encryption using CryptoJS before writing to blockchain.

Smart contract transactions signed through MetaMask for user validation.

JWT-based token authentication with role-based access control.
## Future Enhancements
Mobile app for QR scanning and product verification.

AI-based anomaly detection for supply chain data.

Multi-chain support (Ethereum, Binance Smart Chain, etc.).