"use client";

import { useEffect, useState, FormEvent } from "react";
import Header from "../components/TherapistHeader";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

type Exercise = {
  id: number;
  name: string;
  category?: string;
  description?: string;
};

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch(`${BACKEND}/exercises`)
      .then((r) => r.json())
      .then((data) => setExercises(data))
      .catch(() => setExercises([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  // simple feedback state for saving to favorites
  const [favLoading, setFavLoading] = useState<Record<number, boolean>>({});
  const [favError, setFavError] = useState<string | null>(null);

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
      .then((created) => {
        setExercises((prev) => [created, ...prev]);
        setName(''); setCategory(''); setDescription('');
      })
      .catch((err) => setError(String(err.message || err)))
      .finally(() => setSaving(false));
  }

  return (
    <div className="main">
      <Header />
      <div className="content">
        <h2>Exercise Library</h2>

        <form className="add-exercise" onSubmit={submit} style={{ marginBottom: 12, width: '100%', maxWidth: 900 }}>
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="Category (optional)" value={category} onChange={(e) => setCategory(e.target.value)} />
          <input placeholder="Short description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <button type="submit" disabled={saving} style={{ padding: '8px 12px' }}>{saving ? 'Saving...' : 'Add Exercise'}</button>
        </form>
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}

        {loading ? (
          <div>Loading library...</div>
        ) : (
          <div className="exercise-list" style={{ width: '100%', maxWidth: 900, border: '1px solid #eee', padding: 12, borderRadius: 8 }}>
            {exercises.length === 0 ? (
              <div style={{ color: '#666' }}>No exercises in the library.</div>
            ) : (
              (() => {
                // group exercises by category (body part)
                const groups: Record<string, Exercise[]> = exercises.reduce((acc, cur) => {
                  const key = cur.category && cur.category.trim() ? cur.category : 'Uncategorized';
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(cur);
                  return acc;
                }, {} as Record<string, Exercise[]>);

                return Object.keys(groups)
                  .sort()
                  .map((cat) => (
                    <section key={cat} style={{ marginBottom: 12 }}>
                      <h4 style={{ margin: '8px 0' }}>{cat}</h4>
                      <div>
                        {groups[cat].map((ex) => (
                          <div key={ex.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                            <div>
                              <div style={{ fontWeight: 600 }}>{ex.name}</div>
                              {ex.description && <div style={{ fontSize: 12, color: '#666' }}>{ex.description}</div>}
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                disabled={!!favLoading[ex.id]}
                                onClick={() => {
                                  setFavError(null);
                                  setFavLoading((s) => ({ ...s, [ex.id]: true }));
                                  fetch(`${BACKEND}/therapists/therapist1/favorites`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(ex)
                                  })
                                    .then((r) => {
                                      if (r.status === 409) throw new Error('Already in My Library');
                                      if (!r.ok) throw new Error('Failed to save favorite');
                                      return r.json();
                                    })
                                    .then(() => setFavLoading((s) => ({ ...s, [ex.id]: false })))
                                    .catch((err) => {
                                      setFavLoading((s) => ({ ...s, [ex.id]: false }));
                                      setFavError(String(err.message || err));
                                    });
                                }}
                                style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: '#007da4', color: 'white', cursor: 'pointer' }}
                              >
                                {favLoading[ex.id] ? 'Saving...' : 'Save to My Library'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ));
              })()
            )}
          </div>
        )}
        {favError && <div style={{ color: 'red', marginTop: 8 }}>{favError}</div>}
      </div>
    </div>
  );
}
