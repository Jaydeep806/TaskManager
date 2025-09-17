import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import "./login.css"; // Import the CSS file
import Admin from "../pages/Admin";
import { useNavigate } from "react-router-dom";
function Login({ setToken }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Google login success
  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError("");
    
    try {
      console.log("Google credential:", credentialResponse);
      
      const res = await axios.post("http://localhost:5000/api/auth/google", {
        token: credentialResponse.credential,
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      setEmail(res.data.email);
      setShowOtp(true);
      console.log("Google login successful, email:", res.data.email);
      
    } catch (err) {
      console.error("Google Login Error:", err);
      
      if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
        setError("Cannot connect to server. Please make sure your backend is running on http://localhost:5000");
      } else if (err.response) {
        setError(`Server error: ${err.response.status} - ${err.response.data?.message || 'Unknown error'}`);
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Google login failure
  const handleGoogleError = () => {
    console.log("Google Login Failed");
    setError("Google login failed. Please try again.");
  };

  // Verify OTP
  const verifyOtp = async () => {
    if (!otp.trim()) {
      setError("Please enter the OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axios.post("http://localhost:5000/api/auth/verify", { 
        email, 
        otp: otp.trim() 
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      setToken(res.data.token);
      console.log("OTP verified successfully");
      
    } catch (err) {
      console.error("OTP Verification Error:", err);
      
      if (err.response?.status === 400) {
        setError("Invalid OTP. Please try again.");
      } else if (err.code === 'ECONNREFUSED') {
        setError("Cannot connect to server. Please check if backend is running.");
      } else {
        setError("Verification failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP input change
  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
  };

  // Handle resend OTP
  const handleResendOtp = async () => {
    setLoading(true);
    setError("");
    
    try {
      // Add your resend OTP API call here
      console.log("Resending OTP to:", email);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Animated background shapes */}
      <div className="background-shapes">
        <div className="floating-shape"></div>
        <div className="floating-shape"></div>
        <div className="floating-shape"></div>
        <div className="floating-shape"></div>
      </div>

      {/* Main login card */}
      <div className="login-card">
        {/* Header section */}
        <div className="login-header">
          <div className="login-logo">
            🔐
          </div>
          <h1 className="login-title">
            {showOtp ? "Verify Your Email" : "Welcome Back"}
          </h1>
          <p className="login-subtitle">
            {showOtp ? "Enter the verification code we sent to your email" : "Sign in to continue to your account"}
          </p>
          <div>
             <button className="admin-button" onClick={() => navigate("/admin")}>Go to Admin</button>

          </div>
       
        </div>

        {/* Error message */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Google Sign In Section */}
        {!showOtp ? (
          <div className="google-signin-section">
            <div className="google-signin-wrapper">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
                disabled={loading}
                theme="outline"
                size="large"
                width="100%"
              />
            </div>
            
            {loading && (
              <div className="loading-dots">
                <div className="loading-dot"></div>
                <div className="loading-dot"></div>
                <div className="loading-dot"></div>
                <span>Signing in...</span>
              </div>
            )}
          </div>
        ) : (
          /* OTP Verification Section */
          <div className="otp-section">
            <div className="otp-header">
              <div className="otp-icon-wrapper">
                📧
              </div>
              <h2 className="otp-title">Check Your Email</h2>
              <p className="otp-description">
                We've sent a 6-digit verification code to:
              </p>
              <div className="otp-email">{email}</div>
            </div>

            {/* OTP Input */}
            <div className="otp-input-wrapper">
              <input
                type="text"
                className="otp-input"
                placeholder="• • • • • •"
                value={otp}
                onChange={handleOtpChange}
                maxLength="6"
                disabled={loading}
                autoComplete="one-time-code"
              />
              
              {otp.length === 6 && (
                <div className="otp-success-indicator">
                  ✓
                </div>
              )}
              
              {/* Progress indicators */}
              <div className="otp-progress">
                {[...Array(6)].map((_, index) => (
                  <div
                    key={index}
                    className={`otp-progress-dot ${index < otp.length ? 'active' : ''}`}
                  />
                ))}
              </div>
            </div>

            {/* Verify Button */}
            <button
              className="btn btn-primary"
              onClick={verifyOtp}
              disabled={loading || otp.length !== 6}
            >
              {loading ? (
                <div className="btn-loading">
                  <div className="btn-spinner"></div>
                  <span>Verifying...</span>
                </div>
              ) : (
                "Verify Code"
              )}
            </button>

            {/* Back to Sign In */}
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowOtp(false);
                setOtp("");
                setError("");
              }}
              disabled={loading}
            >
              ← Back to Sign In
            </button>

            {/* Resend OTP Section */}
            <div className="resend-section">
              <p className="resend-text">Didn't receive the code?</p>
              <button
                className="resend-button"
                onClick={handleResendOtp}
                disabled={loading}
              >
                Resend Code
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="login-footer">
          <div className="security-badge">
            <span className="security-icon">🛡️</span>
            <span>Protected by advanced security measures</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;