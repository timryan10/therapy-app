"use client";

import logo from "../raleigh-ortho-logo.png";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function PatientHeader() {
  const handleLogout = async () => {
    try {
      await fetch(`${BACKEND}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // best-effort logout
    }
    window.location.replace("/");
  };

  return (
    <div className="header">
      <nav className="navbar">
        <img src={logo.src} alt="Raleigh Ortho Logo" width={100} height={100} />
        <button type="button" className="logout-button" onClick={handleLogout}>Logout</button>
      </nav>
    </div>
  );
}