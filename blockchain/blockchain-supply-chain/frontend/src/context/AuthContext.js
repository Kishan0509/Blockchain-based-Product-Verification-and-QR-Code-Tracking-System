import React, { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000; 
      if (decoded.exp < currentTime) {
        localStorage.removeItem("token");
        setUser(null);
      } else {
        setUser(decoded); 
      }
    } else {
      setUser(null); 
    }
    setLoading(false);
  }, []);

  // ✅ Login function
  const login = (token) => {
    try {
      localStorage.setItem("token", token);
      const decoded = jwtDecode(token);
      setUser (decoded);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  // ✅ Logout function
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {loading ? <h1>Loading...</h1> : children}
    </AuthContext.Provider>
  );
};

export { AuthContext }; 
export default AuthContext; 

