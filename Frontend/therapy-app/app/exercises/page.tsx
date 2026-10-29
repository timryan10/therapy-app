"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../components/TherapistHeader";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

type Exercise = {
  id: number;
  name: string;
  description?: string;
  mediaUrl?: string;
  mediaType?: string;
  thumbnailUrl?: string;
};

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
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

  const q = (search || '').trim().toLowerCase();
  const filtered = q
    ? exercises.filter((ex) => (ex.name || '').toLowerCase().includes(q) || (ex.description || '').toLowerCase().includes(q))
    : exercises;

  const mediaSrcFor = (mediaUrl?: string) => {
    if (!mediaUrl) return '';
    if (mediaUrl.startsWith('/uploads/')) return `${BACKEND}${mediaUrl}`;
    return mediaUrl;
  };

  const thumbnailSrcFor = (ex: Exercise) => mediaSrcFor(ex.thumbnailUrl);

  const isVideoMedia = (ex: Exercise) => {
    const url = ex.mediaUrl || '';
    const byType = (ex.mediaType || '').toLowerCase().startsWith('video/');
    const byExt = /\.(mp4|webm|ogg|mov|m4v)$/i.test(url);
    const hasKnownImageExt = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(url);
    // fallback for older uploads that had no extension and no mediaType
    const unknownNoExt = !!url && !byExt && !hasKnownImageExt && !ex.mediaType;
    return byType || byExt || unknownNoExt;
  };

  return (
    <div className="main">
      <Header />
      <div className="content">
        <h2>Exercise Library</h2>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, width: '100%', maxWidth: 900 }}>
          <input
            aria-label="Search exercises"
            placeholder="Search exercises by name or description"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '8px 10px', flex: 1, borderRadius: 6, border: '1px solid #ccc' }}
          />
          <a href="/exercises/new" style={{ padding: '8px 12px', borderRadius: 6, background: '#007da4', color: '#fff', textDecoration: 'none' }}>New Exercise</a>
        </div>
        {loading ? (
          <div>Loading library...</div>
        ) : (
          <div className="exercise-list" style={{ width: '100%', maxWidth: 900, border: '1px solid #eee', padding: 12, borderRadius: 8 }}>
            {filtered.length === 0 ? (
              <div style={{ color: '#666' }}>No exercises in the library.</div>
            ) : (
              filtered.map((ex) => (
                <div key={ex.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {ex.mediaUrl && (
                      isVideoMedia(ex)
                        ? (thumbnailSrcFor(ex)
                          ? <img src={thumbnailSrcFor(ex)} alt={`${ex.name} thumbnail`} loading="lazy" style={{ width: 140, height: 80, borderRadius: 6, objectFit: 'cover', background: '#000' }} />
                          : <div style={{ width: 140, height: 80, borderRadius: 6, background: '#1f1f1f', color: '#fff', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Video</div>)
                        : <img src={mediaSrcFor(ex.mediaUrl)} alt="media" loading="lazy" style={{ width: 140, height: 80, borderRadius: 6, objectFit: 'cover' }} />
                    )}
                    <div>
                      <Link href={`/exercises/${encodeURIComponent(String(ex.id))}`} style={{ fontWeight: 600, color: '#007da4', textDecoration: 'none' }}>
                        {ex.name}
                      </Link>
                    </div>
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
              ))
            )}
          </div>
        )}

        {favError && <div style={{ color: 'red', marginTop: 8 }}>{favError}</div>}
      </div>
    </div>
  );
}
