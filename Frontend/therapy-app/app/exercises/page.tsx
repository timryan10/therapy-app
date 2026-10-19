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
  const [search, setSearch] = useState<string>('');

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
    // also load therapist favorites so we can show saved state on buttons
    loadFavorites();
  }, []);

  // track which exercises are already saved to the therapist's library
  const [favoriteIds, setFavoriteIds] = useState<Record<number, boolean>>({});

  function loadFavorites() {
    fetch(`${BACKEND}/therapists/therapist1/favorites`)
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return setFavoriteIds({});
        const map: Record<number, boolean> = {};
        data.forEach((d: any) => {
          if (d && d.id != null) map[Number(d.id)] = true;
        });
        setFavoriteIds(map);
      })
      .catch(() => setFavoriteIds({}));
  }

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

  const q = (search || '').trim().toLowerCase();
  const filtered = q
    ? exercises.filter((ex) => (ex.name || '').toLowerCase().includes(q) || (ex.category || '').toLowerCase().includes(q) || (ex.description || '').toLowerCase().includes(q))
    : exercises;

  const groupsFiltered: Record<string, Exercise[]> = filtered.reduce((acc, cur) => {
    const key = cur.category && cur.category.trim() ? cur.category : 'Uncategorized';
    if (!acc[key]) acc[key] = [];
    acc[key].push(cur);
    return acc;
  }, {} as Record<string, Exercise[]>);

  return (
    <div className="main">
      <Header />
      <div className="content">
        <h2>Exercise Library</h2>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, width: '100%', maxWidth: 900 }}>
          <input
            aria-label="Search exercises"
            placeholder="Search exercises by name, category or description"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '8px 10px', flex: 1, borderRadius: 6, border: '1px solid #ccc' }}
          />
          <a href="/exercises/new" style={{ padding: '8px 12px', borderRadius: 6, background: '#007da4', color: '#fff', textDecoration: 'none' }}>New Exercise</a>
        </div>
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}

        {loading ? (
          <div>Loading library...</div>
        ) : (
          <div className="exercise-list" style={{ width: '100%', maxWidth: 900, border: '1px solid #eee', padding: 12, borderRadius: 8 }}>
            {filtered.length === 0 ? (
              <div style={{ color: '#666' }}>No exercises in the library.</div>
            ) : (
              Object.keys(groupsFiltered)
                .sort()
                .map((cat) => (
                  <section key={cat} style={{ marginBottom: 12 }}>
                    <h4 style={{ margin: '8px 0' }}>{cat}</h4>
                    <div>
                      {groupsFiltered[cat].map((ex) => (
                        <div key={ex.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{ex.name}</div>
                            {ex.description && <div style={{ fontSize: 12, color: '#666' }}>{ex.description}</div>}
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              disabled={!!favLoading[ex.id] || !!favoriteIds[ex.id]}
                              onClick={() => {
                                if (favoriteIds[ex.id]) return;
                                setFavError(null);
                                setFavLoading((s) => ({ ...s, [ex.id]: true }));
                                fetch(`${BACKEND}/therapists/therapist1/favorites`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify(ex)
                                })
                                  .then((r) => {
                                    if (r.status === 409) {
                                      // already saved; mark locally
                                      setFavoriteIds((s) => ({ ...s, [ex.id]: true }));
                                      return null;
                                    }
                                    if (!r.ok) throw new Error('Failed to save favorite');
                                    return r.json();
                                  })
                                  .then(() => {
                                    // mark saved locally
                                    setFavoriteIds((s) => ({ ...s, [ex.id]: true }));
                                  })
                                  .catch((err) => {
                                    setFavError(String(err.message || err));
                                  })
                                  .finally(() => {
                                    setFavLoading((s) => ({ ...s, [ex.id]: false }));
                                  });
                              }}
                              style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: favoriteIds[ex.id] ? '#6c757d' : '#007da4', color: 'white', cursor: favoriteIds[ex.id] ? 'default' : 'pointer', minWidth: 140, display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}
                            >
                              {favoriteIds[ex.id] ? 'Saved' : (favLoading[ex.id] ? 'Saving...' : 'Save to My Library')}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))
            )}
          </div>
        )}

        {favError && <div style={{ color: 'red', marginTop: 8 }}>{favError}</div>}
      </div>
    </div>
  );
}
