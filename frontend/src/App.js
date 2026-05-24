import React, { useEffect, useState } from "react";
import { AuthProvider } from "./context/AuthContext";
import { loadWeb3, web3 } from "./web3";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import AppRoutes from "./AppRoutes";
import "./App.css";

const App = () => {
  const [account, setAccount] = useState("");

  useEffect(() => {
    const initWeb3 = async () => {
      if (!window.ethereum) return;
      try {
        await loadWeb3();
        const accounts = await web3.eth.getAccounts();
        if (accounts.length > 0) setAccount(accounts[0]);
      } catch (err) {
        console.error("Web3 Init Error:", err);
      }
    };
    initWeb3();
  }, []);

  return (
    <AuthProvider>
      <div className="app-container">
        <NavBar />
        <div className="main-content">
          <AppRoutes />
        </div>
        <Footer />
      </div>
    </AuthProvider>
  );
};

export default App;
