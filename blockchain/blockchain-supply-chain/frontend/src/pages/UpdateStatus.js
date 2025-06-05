import React, { useState, useEffect, useRef, useContext } from "react";
import { AuthContext } from '../context/AuthContext';
import QrScanner from "qr-scanner";
import { ethers } from "ethers";
import axios from "axios";
import contractABI from "../contractABI.json";
import { withRetry } from '../utils/retry'; // adjust path as needed

import "../styles/UpdateStatus.css";

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
const rpcUrl = process.env.REACT_APP_RPC_URL;
const API_BASE_URL = process.env.REACT_APP_API_URL;

const UpdateStatus = () => {
  const { user } = useContext(AuthContext);

  const [serialNumber, setSerialNumber] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanMode, setScanMode] = useState(null);
  const [method, setMethod] = useState(null);
  const [scanningPrivateKey, setScanningPrivateKey] = useState(false);

  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);
  const isScanningRef = useRef(false);

  const statusMapping = {
    manufacturer: "Manufactured",
    supplier: "Shipped",
    retailer: "Delivered",
  };

  useEffect(() => {
    if (user && user.role) {
      const status = statusMapping[user.role];
      setNewStatus(status || "");
    }
  }, [user]);

  const startScanner = () => {
    if (videoRef.current && !isScanningRef.current) {
      isScanningRef.current = true;
      qrScannerRef.current = new QrScanner(videoRef.current, (result) => {
        const serialMatch = result.data.match(/Serial:\s*([^\s]+)/i);
        if (serialMatch) {
          const scannedSerial = serialMatch[1];
          setSerialNumber(scannedSerial);
          stopScanner();
        } else {
          setStatusMessage("❌ Invalid QR Code. No serial number found.");
        }
      });

      qrScannerRef.current.start().catch((error) => {
        console.error("❌ QR Scanner Failed to Start:", error);
        setStatusMessage("⚠️ Unable to start QR scanner.");
        isScanningRef.current = false;
      });
    }
  };

  const stopScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
      isScanningRef.current = false;
    }
    setScanMode(null);
  };

  useEffect(() => {
    return () => stopScanner();
  }, []);

  useEffect(() => {
    if (scanningPrivateKey && videoRef.current) {
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        async (result) => {
          qrScannerRef.current.stop();
          setScanningPrivateKey(false);
          const privateKey = result.data.trim();
          await updateWithPrivateKey(privateKey);
        },
        { returnDetailedScanResult: true }
      );

      QrScanner.hasCamera().then((hasCamera) => {
        if (hasCamera) qrScannerRef.current.start();
        else setStatusMessage("❌ No camera found for private key scan.");
      });
    }

    return () => qrScannerRef.current?.stop();
  }, [scanningPrivateKey]);

  const checkAnomaly = async (serialNumber, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/getProduct/${serialNumber.trim()}`);
      const data = await response.json();

      if (!data.success || !data.data?.status) {
        return "❌ Failed to retrieve product status from backend.";
      }

      const currentStatus = data.data.status;
      const validTransitions = {
        Manufactured: ["Shipped"],
        Shipped: ["Delivered"],
        Delivered: [],
      };

      const validNext = validTransitions[currentStatus] || [];

      if (!validNext.includes(newStatus)) {
        return `❌ Anomaly detected: Invalid transition from "${currentStatus}" to "${newStatus}"`;
      }

      return null;
    } catch (error) {
      console.error("❌ Anomaly check failed:", error);
      return "❌ Error fetching product status from backend.";
    }
  };

  const handleMethodSelection = async (selectedMethod) => {
    if (!serialNumber.trim() || !newStatus.trim()) {
      setStatusMessage("⚠️ Please enter Serial Number.");
      return;
    }

    const anomalyMessage = await checkAnomaly(serialNumber, newStatus);
    if (anomalyMessage) {
      setStatusMessage(anomalyMessage);
      return;
    }

    setMethod(selectedMethod);

    if (selectedMethod === "metamask") {
      updateWithMetaMask();
    } else if (selectedMethod === "qr") {
      setStatusMessage(`📷 Scan your private key QR to sign for serial ${serialNumber}`);
      setScanningPrivateKey(true);
    }
  };

  const updateWithMetaMask = async () => {
    try {
      setLoading(true);
      setStatusMessage("⏳ Waiting for MetaMask confirmation...");
      await window.ethereum.request({ method: "eth_requestAccounts" });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const tx = await withRetry(() => contract.updateProductStatus(serialNumber.trim(), newStatus.trim()));
      await tx.wait();

      console.log('User data:', {
        role: user.role,
        id: user.id,
        name: user.name
      });

      // ✅ Update history in MongoDB
      await fetch(`${API_BASE_URL}/api/updateHistory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": localStorage.getItem("token"),
        },
        body: JSON.stringify({
          serialNumber: serialNumber.trim(),
          role: user.role,
          userId: user._id || user.id, // from context
          userName: user.name, // optional if not storing in MongoDB
        }),
      });


      setStatusMessage(`✅ Status updated successfully: ${newStatus}`);
      setSerialNumber("");
    } catch (error) {
      console.error("❌ MetaMask Error:", error);
      setStatusMessage(`❌ ${error?.message || "MetaMask error"}`);
    } finally {
      setLoading(false);
    }
  };

  const updateWithPrivateKey = async (privateKey) => {
    try {
      setLoading(true);
      setStatusMessage("🔐 Signing transaction with private key...");

      const wallet = new ethers.Wallet(privateKey);
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const signer = wallet.connect(provider);
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const tx = await withRetry(() => contract.updateProductStatus(serialNumber.trim(), newStatus.trim()));
      await tx.wait();

      console.log('User data:', {
        role: user.role,
        id: user.id,
        name: user.name
      });

      // ✅ Update history in MongoDB
      await fetch(`${API_BASE_URL}/api/updateHistory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": localStorage.getItem("token"),
        },
        body: JSON.stringify({
          serialNumber: serialNumber.trim(),
          role: user.role,
          userId: user._id || user.id, // from context
          userName: user.name, // optional if not storing in MongoDB
        }),
      });


      setStatusMessage(`✅ Status updated using private key: ${newStatus}`);
      setSerialNumber("");
    } catch (error) {
      console.error("❌ Private Key Error:", error);
      setStatusMessage(`❌ Error using private key: ${error?.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="update-container">
      <h2>🔄 Update Product Status</h2>

      {scanMode === "scanner" && (
        <div className="scanner-container">
          <video ref={videoRef} style={{ width: "100%" }} />
          <button onClick={stopScanner}>🛑 Stop Scanner</button>
        </div>
      )}

      <div className="method-buttons">
        <button onClick={() => {
          stopScanner();
          setScanMode("scanner");
          startScanner();
        }}>
          📷 Scan Product QR
        </button>
      </div>

      {scanMode !== "scanner" && (
        <input
          type="text"
          placeholder="Enter Serial Number"
          value={serialNumber}
          onChange={(e) => setSerialNumber(e.target.value.trimStart())}
          disabled={loading}
        />
      )}

      <div className="status-display">
        <p>Status: {newStatus || "Not set"}</p>
      </div>

      <div className="method-buttons">
        <button
          disabled={loading || !serialNumber}
          onClick={() => handleMethodSelection("metamask")}
        >
          🦊 Sign with MetaMask
        </button>
        <button
          disabled={loading || !serialNumber}
          onClick={() => handleMethodSelection("qr")}
        >
          🔐 Sign with QR (Private Key)
        </button>
      </div>

      {scanningPrivateKey && (
        <div className="scanner-container">
          <p>📷 Scan your wallet's private key</p>
          <video ref={videoRef} style={{ width: "100%" }} />
          <button onClick={() => setScanningPrivateKey(false)}>❌ Cancel</button>
        </div>
      )}

      {statusMessage && (
        <p className={`status-message ${statusMessage.includes("❌") ? "error" : "success"}`}>
          {statusMessage}
        </p>
      )}
    </div>
  );
};

export default UpdateStatus;