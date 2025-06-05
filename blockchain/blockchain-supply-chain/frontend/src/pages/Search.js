import React, { useState, useEffect, useRef } from "react";
import QrScanner from "qr-scanner";
import QRCode from "qrcode";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "../styles/Search.css";
import { decryptData } from "../utils/encryptionUtils";

const API_BASE_URL = process.env.REACT_APP_API_URL;

const Search = () => {
  const [productDetails, setProductDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scanMode, setScanMode] = useState(null);
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);
  const isScanningRef = useRef(false);

  const generatePDF = async () => {
    const input = document.getElementById("pdf-report");
    input.style.display = "block"; 

    const qrData = `https://your-verification-url.com/search/${productDetails.serial}`;
    const qrImageUrl = await QRCode.toDataURL(qrData);

    const qrImg = document.getElementById("qr-code-img");
    qrImg.src = qrImageUrl;

    const canvas = await html2canvas(input, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: [canvas.width, canvas.height],
    });

    pdf.addImage(imgData, "PNG", 0, 0);
    pdf.save(`Product_Search_Report_${productDetails.serial}.pdf`);

    input.style.display = "none";
  };

  // ✅ Upload QR Code Image
  const handleQRUpload = async (event) => {
    setError("");
    setProductDetails(null);

    const file = event.target.files[0];
    if (!file) {
      setError("⚠️ Please upload a valid QR code.");
      return;
    }

    try {
      setLoading(true);
      setError("🔍 Scanning QR code...");
      const qrResult = await QrScanner.scanImage(file);
      // console.log("✅ Scanned QR Code Data:", qrResult);

      const serialMatch = qrResult.match(/Serial:\s*([^\s]+)/i);
      if (!serialMatch) {
        throw new Error("❌ Invalid QR Code. No serial number found.");
      }

      const serialNumber = serialMatch[1]; 
      await searchProduct(serialNumber);
    } catch (error) {
      console.error("❌ QR Code Scan Failed:", error);
      setError(error.message || "⚠️ Unable to read QR code.");
    } finally {
      setLoading(false);
    }
  };

  const searchProduct = async (serialNumber) => {
    setLoading(true);
    setError("🔍 Searching product...");

    try {
      const response = await fetch(`${API_BASE_URL}/api/getProduct/${serialNumber}`);
      const data = await response.json();

      if (data.success) {
        const decryptedName = decryptData(data.data.name);
        const decryptedManufacturer = decryptData(data.data.manufacturer);

        setProductDetails({
          name: decryptedName,
          manufacturer: decryptedManufacturer,
          serial: data.data.serialNumber,
          status: data.data.status,
          productionDate: data.data.timestamp,
          owner: data.data.owner,
          history: data.data.history,
        });

        setError("");
        setScanMode(null);
      } else {
        setError(data.message || "❌ Product not found!");
      }
    } catch (error) {
      console.error("❌ Verification Failed:", error);
      setError("⚠️ Unable to fetch product details from the server.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Start camera QR scanner
  const startScanner = () => {
    if (videoRef.current && !isScanningRef.current) {
      isScanningRef.current = true;
      qrScannerRef.current = new QrScanner(videoRef.current, async (result) => {

        const serialMatch = result.match(/Serial:\s*([^\s]+)/i);
        if (serialMatch) {
          stopScanner();
          const serialNumber = serialMatch[1];
          await searchProduct(serialNumber);
        } else {
          setError("❌ Invalid QR Code. No serial number found.");
        }
      });

      qrScannerRef.current.start().catch((error) => {
        console.error("❌ QR Scanner Failed to Start:", error);
        setError("⚠️ Unable to start QR scanner.");
        isScanningRef.current = false;
      });
    }
  };

  // ✅ Stop camera scanner
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

  return (
    <div className="search-container">
      <h2>🔍 Search Product</h2>
     <p>Select a method to search for product details stored on the blockchain.</p>
      <div className="method-buttons">
        <button onClick={() => { stopScanner(); setScanMode("upload"); }}> 📁 Upload QR Image </button>
        <button
          onClick={() => {
            setScanMode("scanner");
            startScanner();
          }}
        >
          📷 Scan with Camera
        </button>
      </div>

      {/* ✅ QR Upload */}
      {scanMode === "upload" && (
        <div className="form-group">
          <input type="file" accept="image/*" onChange={handleQRUpload} />
        </div>
      )}

      {scanMode === "scanner" && (
        <div className={`scanner-container ${!scanMode ? "hidden" : ""}`}>
          <video ref={videoRef} style={{ width: "100%", height: "auto" }} />
          <button onClick={stopScanner}>🛑 Stop Scanner</button>
        </div>
      )}

      {error && <p className="error-message">{error}</p>}

      {productDetails && (
        <>
          <div className="product-details">
            <h3>✅ Product Found</h3>
            <p><strong>Name:</strong> {productDetails.name}</p>
            <p><strong>Manufacturer:</strong> {productDetails.manufacturer}</p>
            <p><strong>Serial Number:</strong> {productDetails.serial}</p>
            <p><strong>Status:</strong> {productDetails.status}</p>
            <p><strong>Production Date:</strong> {new Date(productDetails.productionDate).toLocaleString()}</p>
            <p><strong>Owner:</strong> {productDetails.owner}</p>
          </div>

          {productDetails.history && productDetails.history.length > 0 && (
            <div className="progress-tracker">
              {productDetails.history.map((step, index) => (
                <div className="progress-step" key={index}>
                  <div className="step-circle">{index + 1}</div>
                  <div className="step-info">
                    <strong>{step.role}</strong>
                    <p>{new Date(step.transferredAt).toLocaleString()}</p>
                    {step.userId?.name && <small>by {step.userId.name}</small>}
                  </div>
                  {index < productDetails.history.length - 1 && <div className="step-line"></div>}
                </div>
              ))}
            </div>
          )}



          <button onClick={generatePDF} className="download-btn">
            📄 Download Report
          </button>

          <div
            id="pdf-report"
            style={{
              display: "none",
              padding: "30px",
              width: "600px",
              fontFamily: "Arial, sans-serif",
              position: "relative",
              backgroundColor: "#fff",
              color: "#000",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <img src="/your-logo.png" alt="Company Logo" style={{ width: "80px" }} />
              <h2>Product Search Report</h2>
            </div>

            <p><strong>Name:</strong> {productDetails.name}</p>
            <p><strong>Manufacturer:</strong> {productDetails.manufacturer}</p>
            <p><strong>Serial Number:</strong> {productDetails.serial}</p>
            <p><strong>Status:</strong> {productDetails.status}</p>
            <p><strong>Production Date:</strong> {new Date(productDetails.productionDate).toLocaleString()}</p>
            <p><strong>Owner:</strong> {productDetails.owner}</p>
            <p><strong>Search Performed On:</strong> {new Date().toLocaleString()}</p>

            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <img id="qr-code-img" src="" alt="Verification QR Code" style={{ width: "100px", height: "100px" }} />
              <p style={{ fontSize: "12px" }}>Scan to search online</p>
            </div>

            <div
              style={{
                position: "absolute",
                top: "40%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: "50px",
                color: "rgba(0, 0, 0, 0.1)",
                transformOrigin: "center",
                pointerEvents: "none",
              }}
            >
              VERIFIED
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Search;

 
