import React from "react";
import { createRoot } from "react-dom/client"; 
import { BrowserRouter as Router } from "react-router-dom";
import ReactDOM from "react-dom/client";
import App from "./App";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./styles/styles.css"; // ✅ Ensure correct path

import { AuthProvider } from "./context/AuthContext"; // Import AuthProvider


const root = document.getElementById("root");

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;


// ✅ Check if root element exists before rendering
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <GoogleOAuthProvider clientId={clientId}>
        <AuthProvider>
          <Router>
            <App />
          </Router>
        </AuthProvider>
      </GoogleOAuthProvider>
    </React.StrictMode>
  );
} else {
  console.error("❌ Root element not found! Check your index.html file.");
}
