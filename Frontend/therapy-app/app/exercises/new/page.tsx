"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/TherapistHeader";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function NewExercisePage() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function submit(e?: FormEvent) {
    e?.preventDefault?.();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) return setError('Name is required');
    setSaving(true);
    fetch(`${BACKEND}/exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed, category: category.trim(), description: description.trim() })
    })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to create');
        return r.json();
      })
      .then(() => {
        router.push('/exercises');
      })
      .catch((err) => setError(String(err.message || err)))
      .finally(() => setSaving(false));
  }

  return (
    <div className="main">
      <Header />
      <div className="content">
        <h2>New Exercise</h2>

        <form className="patient-form" onSubmit={submit} style={{ width: '100%', maxWidth: 900, marginTop: 12 }}>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Category (optional)
            <input value={category} onChange={(e) => setCategory(e.target.value)} />
          </label>
          <label>
            Short description (optional)
            <input value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>

          <div style={{ marginTop: 12 }}>
            <button type="submit" disabled={saving} style={{ padding: '8px 12px', borderRadius: 6, background: '#007da4', color: '#fff', border: 'none' }}>{saving ? 'Saving...' : 'Create Exercise'}</button>
            <button type="button" onClick={() => router.back()} style={{ marginLeft: 8, padding: '8px 12px', borderRadius: 6 }}>Cancel</button>
          </div>
        </form>

        {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}
      </div>
    </div>
  );
}
