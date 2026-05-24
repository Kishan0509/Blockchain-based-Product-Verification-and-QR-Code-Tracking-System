import React, { useState, useRef, useEffect } from "react";
import QrScanner from "qr-scanner";
import { ethers } from "ethers";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";
import contractABI from "../contractABI.json";
import { encryptData } from "../utils/encryptionUtils";

import {withRetry} from '../utils/retry';
import { extractErrorReason } from "../utils/errorUtils";

import "../styles/RegisterProduct.css";

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
const rpcUrl = process.env.REACT_APP_RPC_URL;
const API_BASE_URL = process.env.REACT_APP_API_URL;

const RegisterProduct = () => {
  const [product, setProduct] = useState({ name: "", manufacturer: "", quantity: "", serial: "" });
  const [qrData, setQrData] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState(null);
  const [serials, setSerials] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const scannerRef = useRef(null);

  const generateUniqueSerials = (baseSerial, quantity) => {
    return Array.from({ length: quantity }, (_, i) => `${baseSerial}-${i + 1}`);
  };

  const handleRegister = (selectedMethod) => {
    const qty = parseInt(product.quantity);
    if (!product.name || !product.manufacturer || !product.serial || isNaN(qty) || qty < 1) {
      setStatus("⚠️ Please fill in all fields with valid values.");
      return;
    }

    const generatedSerials = generateUniqueSerials(product.serial, qty);
    setSerials(generatedSerials);
    setMethod(selectedMethod);
    setQrData([]);

    if (selectedMethod === "metamask") {
      registerWithMetaMask(generatedSerials);
    } else if (selectedMethod === "qr") {
      setCurrentIndex(0);
      setStatus(`📷 Please scan private key for ${generatedSerials[0]}`);
      setScanning(true);
    }
  };

  const registerWithMetaMask = async (serialList) => {
    try {
      setLoading(true);
      setStatus("⏳ Registering with MetaMask...");
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const tempQRData = [];

      for (const serial of serialList) {
        const encryptedName = encryptData(product.name);
        const encryptedManufacturer = encryptData(product.manufacturer);
        const tx = await withRetry(() => contract.registerProduct(serial, encryptedName, encryptedManufacturer));
        await tx.wait();
        tempQRData.push({ serial, qr: `Product: ${product.name}, Serial: ${serial}` });
      }

      setQrData(tempQRData);
      setStatus("✅ Products registered via MetaMask!");

      await storeToBackend(serialList, tempQRData);

    }  catch (err) {
        console.error("❌ MetaMask Error:", err);
        setStatus(`❌ ${extractErrorReason(err)}`); 
      } finally {
      setLoading(false);
    }
  };

  const handleScan = async (privateKey) => {
    if (!privateKey || !serials[currentIndex]) {
      setStatus("⚠️ Invalid scan or serial.");
      return;
    }

    const serial = serials[currentIndex];
    try {
      const wallet = new ethers.Wallet(privateKey);
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const signer = wallet.connect(provider);
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const encryptedName = encryptData(product.name);
      const encryptedManufacturer = encryptData(product.manufacturer);

      const tx = await withRetry(() => contract.registerProduct(serial, encryptedName, encryptedManufacturer));
      await tx.wait();

      setQrData((prev) => [...prev, { serial, qr: `Product: ${product.name}, Serial: ${serial}` }]);
      setStatus(`✅ ${serial} registered.`);

      const nextIndex = currentIndex + 1;
      if (nextIndex < serials.length) {
        setCurrentIndex(nextIndex);
        setTimeout(() => {
          setScanning(true);
          setStatus(`📷 Scan private key for ${serials[nextIndex]}`);
        }, 1000);
      } else {
        await storeToBackend(serials, [...qrData, { serial, qr: `Product: ${product.name}, Serial: ${serial}` }]);
        resetForm("🎉 All products registered via QR code!");
      }

    } catch (err) {
      console.error("❌ QR Registration Error:", err);
      setStatus(`❌ ${extractErrorReason(err)}`);
    }
  };

  const storeToBackend = async (serialList, qrList) => {
    const quantity = parseInt(product.quantity);
    const payload = serialList.map(serial => ({
      serialNumber: serial,
      name: product.name,
      manufacturer: product.manufacturer,
      quantity,
    }));

    const token = localStorage.getItem("token");

    try {
      await axios.post(`${API_BASE_URL}/api/register`, 
        { products: payload }, 
        {headers: { 'x-auth-token': token}});
      
      await axios.post(`${API_BASE_URL}/api/storeQRCodes`, {
        qrData: qrList.map(({ serial, qr }) => ({ serial, qr }))
      }, {headers: {'x-auth-token': token}});
    } catch (error) {
      console.error("❌ Backend Store Error:", error);
      throw error;
    }
  };
  const resetForm = (message) => {
    setStatus(message);
    setProduct({ name: "", manufacturer: "", quantity: "", serial: "" });
    setSerials([]);
    setCurrentIndex(0);
    setMethod(null);
    setScanning(false);
  };

  useEffect(() => {
    if (scanning && videoRef.current) {
      scannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          scannerRef.current.stop();
          setScanning(false);
          handleScan(result.data.trim());
        },
        { returnDetailedScanResult: true }
      );

      QrScanner.hasCamera().then((hasCamera) => {
        if (hasCamera) scannerRef.current.start();
        else setStatus("❌ No camera found.");
      });
    }

    return () => scannerRef.current?.stop();
  }, [scanning]);

  return (
    <div className="register-container">
      <h2>🔗 Register Product (MetaMask / QR Code)</h2>

      <div className="form-group">
        <input type="text" placeholder="Product Name" value={product.name} onChange={(e) => setProduct({ ...product, name: e.target.value })} />
        <input type="text" placeholder="Manufacturer" value={product.manufacturer} onChange={(e) => setProduct({ ...product, manufacturer: e.target.value })} />
        <input type="number" placeholder="Quantity" min="1" value={product.quantity} onChange={(e) => setProduct({ ...product, quantity: e.target.value })} />
        <input type="text" placeholder="Base Serial Number" value={product.serial} onChange={(e) => setProduct({ ...product, serial: e.target.value })} />

        <div className="method-buttons">
          <button onClick={() => handleRegister("metamask")} disabled={loading || scanning}>🦊 Register with MetaMask</button>
          <button onClick={() => handleRegister("qr")} disabled={loading || scanning}>📷 Register with QR Code</button>
        </div>
      </div>

      {status && <p className={`status-message ${status.includes("❌") ? "error" : "success"}`}>{status}</p>}

      {scanning && (
        <div className="scanner">
          <video ref={videoRef} style={{ width: "100%", maxWidth: "400px" }} />
          <button onClick={() => setScanning(false)}>❌ Cancel</button>
        </div>
      )}

      {qrData.length > 0 && (
        <div className="qr-section">
          <h3>📌 QR Codes for Registered Products</h3>
          <div className="qr-grid">
            {qrData.map((qr, index) => (
              <div key={index} className="qr-code">
                <QRCodeSVG value={qr.qr} />
                <p>{qr.serial}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterProduct;
