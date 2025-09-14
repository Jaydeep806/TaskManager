import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // ✅ Import Link
import "./navbar.css"; // Import the CSS file

function Navbar({ onLogout, user = null, notifications = 0 }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle logout with loading state
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API call
      onLogout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest(".navbar")) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isMobileMenuOpen]);

  // Get user initials for avatar
  const getUserInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Get current time greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <nav className={`navbar ${isScrolled ? "scrolled" : ""}`}>
      {/* Brand Section */}
      <div className="navbar-brand">
        <div className="navbar-logo">📝</div>
        <div>
          <h1 className="navbar-title">TaskFlow</h1>
          <div className="navbar-subtitle">Stay Organized</div>
        </div>
      </div>

      {/* Desktop Navigation Menu */}
      <div className="navbar-menu">
        <ul className="navbar-nav">
          <li className="nav-item">
            <Link to="/dashboard" className="nav-link">
              <span>📊</span> Dashboard
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/complete" className="nav-link">
              <span>✅</span> Completed Task
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/upcoming" className="nav-link">
              <span>📅</span> Upcoming Task
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/reports" className="nav-link">
              <span>📈</span> Reports
            </Link>
          </li>
        </ul>

        {/* User Section */}
        <div className="navbar-user">
          {/* Notifications */}
          {notifications > 0 && (
            <div className="notification-badge">
              <div className="notification-icon">🔔</div>
              <span className="notification-count">
                {notifications > 99 ? "99+" : notifications}
              </span>
            </div>
          )}

          {/* User Info */}
          {user && (
            <>
              <div className="user-info">
                <div className="user-name">
                  {getGreeting()},{" "}
                  {user.name || user.email?.split("@")[0] || "User"}!
                </div>
                <div className="user-role">{user.role || "Member"}</div>
              </div>
              <div className="user-avatar">
                {user.avatar ? (
                  <img src={user.avatar} alt="User Avatar" />
                ) : (
                  getUserInitials(user.name || user.email)
                )}
              </div>
            </>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="logout-btn"
            disabled={isLoggingOut}
            title="Sign out"
          >
            <span className="logout-icon">{isLoggingOut ? "⏳" : "🚪"}</span>
            <span>{isLoggingOut ? "Signing out..." : "Logout"}</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Button */}
      <button
        className={`mobile-menu-btn ${isMobileMenuOpen ? "active" : ""}`}
        onClick={toggleMobileMenu}
        aria-label="Toggle mobile menu"
      >
        <div className="mobile-menu-icon">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      {/* Mobile Navigation Menu */}
      <div className={`mobile-nav ${isMobileMenuOpen ? "active" : ""}`}>
        <ul className="mobile-nav-list">
          <li className="mobile-nav-item">
            <Link to="/dashboard" className="mobile-nav-link">
              📊 Dashboard
            </Link>
          </li>
          <li className="mobile-nav-item">
            <Link to="/complete" className="mobile-nav-link">
              ✅ Completed Task
            </Link>
          </li>
          <li className="mobile-nav-item">
            <Link to="/upcoming" className="mobile-nav-link">
              📅 Upcoming Task
            </Link>
          </li>
          <li className="mobile-nav-item">
            <Link to="/reports" className="mobile-nav-link">
              📈 Reports
            </Link>
          </li>
          {notifications > 0 && (
            <li className="mobile-nav-item">
              <Link to="/notifications" className="mobile-nav-link">
                🔔 Notifications ({notifications})
              </Link>
            </li>
          )}
          <li className="mobile-nav-item">
            <button
              onClick={handleLogout}
              className="mobile-nav-link"
              disabled={isLoggingOut}
              style={{
                background: "none",
                border: "none",
                width: "100%",
                textAlign: "left",
              }}
            >
              <span>{isLoggingOut ? "⏳" : "🚪"}</span>
              {isLoggingOut ? "Signing out..." : "Logout"}
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
