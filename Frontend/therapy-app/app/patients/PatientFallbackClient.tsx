"use client";

import { useCallback, useEffect, useState } from "react";
import PatientClient from "./[id]/PatientClient";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function PatientFallbackClient({ id }: { id: string }) {
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [patient, setPatient] = useState<any | null>(null);
  const [exercises, setExercises] = useState<any[] | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const maxAttempts = 3;
    for (let i = 1; i <= maxAttempts; i += 1) {
      setAttempt(i);
      try {
        const [pRes, exRes] = await Promise.all([
          fetch(`${BACKEND}/patients/${id}`),
          fetch(`${BACKEND}/exercises`),
        ]);

        if (!pRes.ok) {
          if (pRes.status === 404) {
            setError('Patient not found (404)');
            setLoading(false);
            return;
          }
          throw new Error(`patient fetch status ${pRes.status}`);
        }

        const pJson = await pRes.json();
        const exJson = exRes.ok ? await exRes.json() : [];
        setPatient(pJson);
        setExercises(exJson);
        setLoading(false);
        setError(null);
        return;
      } catch (err: any) {
        setError(err?.message || 'Network error');
        // exponential-ish backoff
        const delay = 500 * i;
        // wait before next attempt unless last
        if (i < maxAttempts) await new Promise((r) => setTimeout(r, delay));
        // continue loop
      }
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Loading patient...</h2>
        <div style={{ color: '#666' }}>Attempt {attempt || 1} — trying to reach backend...</div>
      </div>
    );
  }

  if (patient && exercises) return <PatientClient patient={patient} exercises={exercises} />;

  return (
    <div style={{ padding: 20 }}>
      <h2>Unable to load patient</h2>
      <div style={{ color: '#666', marginBottom: 12 }}>{error}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => load()} style={{ padding: '8px 12px', borderRadius: 6, background: '#007da4', color: '#fff', border: 'none' }}>Retry</button>
        <a href="/existing-patients" style={{ padding: '8px 12px', borderRadius: 6, background: '#eee', color: '#222', textDecoration: 'none' }}>Back to Patients</a>
      </div>
    </div>
  );
}
