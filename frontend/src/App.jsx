import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Login from "../components/Login";
import Dashboard from "../pages/Dashboard";
import CompletedTasks from "../pages/CompletedTasks";
import UpcomingTasks from "../pages/UpcomingTasks";
import ReportsPage from "../pages/ReportsPage";
import Admin from "../pages/Admin";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  const handleLogin = (tok) => {
    localStorage.setItem("token", tok);
    setToken(tok);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  return (
    <Router>
      <Routes>
        {/* Public route */}
        <Route
          path="/"
          element={!token ? <Login setToken={handleLogin} /> : <Navigate to="/dashboard" />}
        />

        {/* Protected routes */}
        {token ? (
          <>
            <Route
              path="/dashboard"
              element={<Dashboard token={token} onLogout={handleLogout} />}
            />
            <Route path="/complete" element={<CompletedTasks />} />
            <Route path="/upcoming" element={<UpcomingTasks />} />
            <Route path="/reports" element={<ReportsPage />} />
          </>
        ) : (
          // If user tries to access protected route without token, redirect to login
          <>
            <Route path="/dashboard" element={<Navigate to="/" />} />
            <Route path="/complete" element={<Navigate to="/" />} />
            <Route path="/upcoming" element={<Navigate to="/" />} />
            <Route path="/reports" element={<Navigate to="/" />} />
          </>
        )}

        {/* Catch-all: redirect unknown routes */}
        <Route path="*" element={<Navigate to={token ? "/dashboard" : "/"} />} />
        <Route path="/admin" element={<Admin/>}/>
      </Routes>
    </Router>
  );
}

export default App;
