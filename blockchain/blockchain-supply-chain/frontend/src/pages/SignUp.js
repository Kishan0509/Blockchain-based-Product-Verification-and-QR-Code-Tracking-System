import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "../styles/SignUp.css";

const API_BASE_URL = process.env.REACT_APP_API_URL;

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "manufacturer",
  });

  const [message, setMessage] = useState(""); 
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await axios.post(`${API_BASE_URL}/api/auth/signup`, formData);
      setMessage("✅ User registered successfully!");

      setFormData({
        name: "",
        email: "",
        password: "",
        role: "manufacturer",
      });
      setTimeout(() => navigate("/login"), 2000);

    } catch (error) {
        setMessage(`❌ ${error.response?.data?.message || "Registration failed!"}`);
    }
  };

  return (
    <div className="SignUp-container">
      <div className="SignUp-card">
       <h2 className="signup-title">Create your account 🧾</h2>

        <form onSubmit={handleSubmit}>
          <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} required />
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
          <select name="role" onChange={handleChange}>
            <option value="manufacturer">Manufacturer</option>
            <option value="supplier">Supplier</option>
            <option value="retailer">Retailer</option>
          </select>
          <button type="submit">🚀 Sign Up</button>
        </form>
        {message && (<p className={message.includes("✅") ? "success-message" : "error-message"}>{message}</p> )}
        <p>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;