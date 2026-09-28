"use client";

import { useEffect, useState } from "react";
import Header from "../components/TherapistHeader";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

type Exercise = {
  id: number;
  name: string;
  category?: string;
  description?: string;
  duration?: string;
  difficulty?: string;
};

export default function TherapistLibrary() {
  const [items, setItems] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<Record<number, boolean>>({});

  function load() {
    setLoading(true);
    fetch(`${BACKEND}/therapists/therapist1/favorites`)
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((e) => setError(String(e || 'Failed to load')))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function removeFavorite(id: number) {
    setRemoving((s) => ({ ...s, [id]: true }));
    fetch(`${BACKEND}/therapists/therapist1/favorites/${id}`, { method: 'DELETE' })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to remove');
        setItems((prev) => prev.filter((p) => String(p.id) !== String(id)));
      })
      .catch((e) => setError(String(e || 'Failed to remove')))
      .finally(() => setRemoving((s) => ({ ...s, [id]: false })));
  }

  return (
    <div className="main">
      <Header />
      <div className="content">
        <h2>My Library</h2>

        {loading && <div>Loading your library...</div>}
        {error && <div style={{ color: 'red' }}>{error}</div>}

        {!loading && items.length === 0 && <div style={{ color: '#666' }}>You have no saved exercises.</div>}

        {!loading && items.length > 0 && (() => {
          const groups = items.reduce((acc: Record<string, Exercise[]>, cur) => {
            const key = cur.category && cur.category.trim() ? cur.category : 'Uncategorized';
            if (!acc[key]) acc[key] = [];
            acc[key].push(cur);
            return acc;
          }, {} as Record<string, Exercise[]>);

          return Object.keys(groups).sort().map((cat) => (
            <section key={cat} style={{ marginBottom: 12 }}>
              <h4 style={{ margin: '8px 0' }}>{cat}</h4>
              <ul className="patient-list">
                {groups[cat].map((it) => (
                  <li key={it.id} className="patient-item">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong>{it.name}</strong>
                      {it.description && <div style={{ fontSize: 12, color: '#666' }}>{it.description}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => removeFavorite(it.id)} disabled={!!removing[it.id]} style={{ background: 'none', border: '1px solid #e0e0e0', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>
                        {removing[it.id] ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ));
        })()}
      </div>
    </div>
  );
}