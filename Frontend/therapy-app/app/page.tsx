"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import logo from "./raleigh-ortho-logo.png";
import TherapistDashboard from "./therapist-dashboard";

// TODO: replace with real authentication against the backend once available
const VALID_USERNAME = "therapist";
const VALID_PASSWORD = "password123";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSignedIn, setIsSignedIn] = useState(false);

  function handleSignIn(e: FormEvent) {
    e.preventDefault();

    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      setError("");
      setIsSignedIn(true);
    } else {
      setError("Invalid username or password.");
    }
  }

  if (isSignedIn) {
    return <TherapistDashboard />;
  }

  return (
    <div className="main">
      <Image src={logo} alt="Raleigh Ortho Logo" />
      <form className="signIn" onSubmit={handleSignIn}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="error">{error}</p>}
        <button type="submit">Sign In</button>
      </form>
    </div>
  );
}
