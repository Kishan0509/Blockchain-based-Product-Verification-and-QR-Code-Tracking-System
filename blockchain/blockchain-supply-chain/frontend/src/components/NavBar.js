import React, { useState, useEffect, useRef, useContext } from "react";
import { Link } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import "./NavBar.css";

const NavBar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sticky, setSticky] = useState(false);
  const navRef = useRef(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setSticky(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`navbar ${sticky ? "sticky" : ""}`} ref={navRef}>
      <div className="navbar-container">
        {/* Top Row: Logo */}
        <div className="navbar-top">
          <Link
            to={user ? "/dashboard" : "/"}
            className="navbar-logo"
            onClick={() => setMenuOpen(false)}
          >
            🔗 Blockchain
          </Link>
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Bottom Row: Links */}
        <div className={`navbar-bottom ${menuOpen ? "open" : ""}`}>
          <div className="nav-links">
            {user && (
              <>
                <Link to="/" onClick={() => setMenuOpen(false)}>📊 Dashboard</Link>

                {(user.role === "admin" || user.role === "manufacturer") && (
                  <Link to="/register" onClick={() => setMenuOpen(false)}>📝 Register Product</Link>
                )}

                <Link to="/search" onClick={() => setMenuOpen(false)}>🔍 Search Product</Link>
                <Link to="/update-status" onClick={() => setMenuOpen(false)}>🔄 Update Status</Link>

                {user.role === "admin" && (
                  <Link to="/admin" onClick={() => setMenuOpen(false)}>⚙️ Admin Panel</Link>
                )}
              </>
            )}
          </div>

          <div className="auth-links">
            {!user ? (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)}>🔑 Login</Link>
                <Link to="/signup" onClick={() => setMenuOpen(false)}>📝 Sign up</Link>
              </>
            ) : (
              <Link to="/profile" onClick={() => setMenuOpen(false)}>👤 Profile</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
