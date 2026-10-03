"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import logo from "./raleigh-ortho-logo.png";
import { useRouter } from "next/navigation";

// TODO: replace with real authentication against the backend once available
const VALID_USERNAME = "therapist";
const VALID_PASSWORD = "password123";

// Demo patient credentials
const VALID_PATIENT_USERNAME = "patient";
const VALID_PATIENT_PASSWORD = "patient123";

export default function Home() {
  const [role, setRole] = useState<"therapist" | "patient">("therapist");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  function handleSignIn(e: FormEvent) {
    e.preventDefault();

    const u = username.trim();
    const p = password.trim();

    if (role === "therapist") {
      if (u === VALID_USERNAME && p === VALID_PASSWORD) {
        setError("");
        router.push('/therapist-dashboard');
        return;
      }
    } else {
      if (u === VALID_PATIENT_USERNAME && p === VALID_PATIENT_PASSWORD) {
        setError("");
        router.push('/patient-dashboard');
        return;
      }
    }

    setError("Invalid username or password.");
  }

  return (
    <div className="main">
      <Image src={logo} alt="Raleigh Ortho Logo" />
      <form className="signIn" onSubmit={handleSignIn}>
        <div className="role-select">
          <label>
            <input
              type="radio"
              name="role"
              value="therapist"
              checked={role === 'therapist'}
              onChange={() => setRole('therapist')}
            />
            Therapist
          </label>
          <label>
            <input
              type="radio"
              name="role"
              value="patient"
              checked={role === 'patient'}
              onChange={() => setRole('patient')}
            />
            Patient
          </label>
        </div>
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
