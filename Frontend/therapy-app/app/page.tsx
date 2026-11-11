"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import logo from "./raleigh-ortho-logo.png";
import { useRouter } from "next/navigation";

// backend
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function Home() {
  const [role, setRole] = useState<"therapist" | "patient">("therapist");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();

    const u = username.trim();
    const p = password.trim();

    if (role === "therapist") {
      try {
        const res = await fetch(`${BACKEND}/auth/therapist-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ username: u, password: p })
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body?.error || 'Invalid username or password.');
          return;
        }
        setError("");
        router.push('/therapist-dashboard');
      } catch (err: any) {
        setError(String(err?.message || 'Network error'));
      }
      return;
    }

    // patient auth: call backend
    try {
      const res = await fetch(`${BACKEND}/auth/patient-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: u, password: p })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error || 'Invalid username or password.');
        return;
      }
      const data = await res.json();
      const id = data?.patient?.id;
      if (!id) { setError('Invalid login response'); return; }
      setError("");
      router.push(`/patient-portal/${id}`);
    } catch (err: any) {
      setError(String(err?.message || 'Network error'));
    }
  }

  return (
    <div className="main auth-main">
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
