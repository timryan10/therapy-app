"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function PatientLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: any) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch(`${BACKEND}/auth/patient-login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error || 'Login failed');
        setLoading(false);
        return;
      }
      const data = await res.json();
      const id = data?.patient?.id;
      if (!id) {
        setError('Login failed'); setLoading(false); return;
      }
      // navigate to patient portal
      router.push(`/patient-portal/${id}`);
    } catch (err: any) {
      setError(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: '40px auto', padding: 20 }}>
      <h2>Patient Login</h2>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input placeholder="Email or username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <div style={{ color: 'crimson' }}>{error}</div>}
        <button type="submit" disabled={loading} style={{ padding: '8px 12px' }}>{loading ? 'Signing in...' : 'Sign in'}</button>
      </form>
    </div>
  );
}
