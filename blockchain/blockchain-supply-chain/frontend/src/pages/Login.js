import { useState, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import "../styles/Login.css";

const API_BASE_URL = process.env.REACT_APP_API_URL;

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    // Google login state
    const [googleUser, setGoogleUser] = useState(null);
    const [showRolePrompt, setShowRolePrompt] = useState(false);
    const [selectedRole, setSelectedRole] = useState("");

    // Handle email/password login
    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage("");
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            if (response.ok) {
                login(data.token);
                setMessage("✅ Login Successful! Redirecting...");
                setTimeout(() => navigate("/"), 1000);
            } else {
                setMessage(`❌ ${data.message || "Login failed!"}`);
            }
        } catch (error) {
            setMessage("❌ An error occurred. Please try again.");
            console.error("Error: ", error);
        } finally {
            setLoading(false);
        }
    };

    // Handle Google login
    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: credentialResponse.credential }),
            });

            const data = await res.json();

            if (res.ok && data.newUser) {
                setGoogleUser({
                    name: data.name,
                    email: data.email,
                    googleId: data.googleId,
                });
                setShowRolePrompt(true);
            } else if (res.ok) {
                login(data.token);
                setMessage("✅ Google Login Successful! Redirecting...");
                setTimeout(() => navigate("/"), 1000);
            } else {
                setMessage(`❌ ${data.message || "Google login failed!"}`);
            }
        } catch (error) {
            console.error("Google Login Error:", error);
            setMessage("❌ Google login failed. Please try again.");
        }
    };

    const handleGoogleFailure = (error) => {
        console.error("Google Login Failed:", error);
        setMessage("❌ Google login failed. Please try again.");
    };

    // Handle role selection submission
    const handleRoleSubmit = async () => {
        if (!selectedRole) {
            setMessage("❌ Please select a role.");
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/google/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...googleUser, role: selectedRole }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage("✅ Account created. Awaiting approval.");
            } else {
                setMessage(`❌ ${data.message || "Registration failed"}`);
            }
        } catch (err) {
            console.error("Role Registration Error:", err);
            setMessage("❌ Something went wrong. Please try again.");
        } finally {
            setShowRolePrompt(false);
        }
    };

    return (
        <div className='login-container'>
            <div className='login-card'>
                <h2 className='login-title'>Welcome Back 👋</h2>
                <p className='login-subtitle'>Please sign in to continue</p>

                <form onSubmit={handleLogin} className='login-form'>
                    <input
                        type='email'
                        placeholder='Email address'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type='password'
                        placeholder='Password'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    {message && (
                        <p className={message.includes("✅") ? "success-message" : "error-message"}>
                            {message}
                        </p>
                    )}
                    <button type="submit" disabled={loading}>
                        {loading ? "🔄 Logging in..." : "🚀 Login"}
                    </button>
                </form>

                <div className='google-section'>
                    <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleFailure} />
                </div>

                <p className="register-text">
                    Don't have an account? <Link to="/signup">Register here</Link>
                </p>
            </div>

            {/* Role selection modal */}
            {showRolePrompt && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Select Your Role</h3>
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                        >
                            <option value="">-- Choose Role --</option>
                            <option value="supplier">Supplier</option>
                            <option value="retailer">Retailer</option>
                            <option value="manufacturer">Manufacturer</option>
                        </select>
                        <button onClick={handleRoleSubmit}>Submit</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
