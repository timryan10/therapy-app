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
  mediaUrl?: string;
  mediaType?: string;
  thumbnailUrl?: string;
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

  const mediaSrcFor = (mediaUrl?: string) => {
    if (!mediaUrl) return '';
    if (mediaUrl.startsWith('/uploads/')) return `${BACKEND}${mediaUrl}`;
    return mediaUrl;
  };

  const thumbnailSrcFor = (ex: Exercise) => {
    if (ex.thumbnailUrl) return mediaSrcFor(ex.thumbnailUrl);
    const url = ex.mediaUrl || '';
    const isImageByType = (ex.mediaType || '').toLowerCase().startsWith('image/');
    const isImageByExt = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(url);
    return isImageByType || isImageByExt ? mediaSrcFor(url) : '';
  };

  return (
    <div className="main">
      <Header />
      <div className="content" style={{ width: '100%', alignItems: 'stretch' }}>
        <h2>My Library</h2>

        {loading && <div>Loading your library...</div>}
        {error && <div style={{ color: 'red' }}>{error}</div>}

        {!loading && items.length === 0 && <div style={{ color: '#666' }}>You have no saved exercises.</div>}

        {!loading && items.length > 0 && (
          <section style={{ marginBottom: 20, width: '100%' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                width: '100%',
              }}
            >
              {items.map((it) => {
                const thumb = thumbnailSrcFor(it);
                return (
                  <article
                    key={it.id}
                    style={{
                      border: '1px solid #e8e8e8',
                      borderRadius: 10,
                      background: '#fff',
                      padding: 12,
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={`${it.name} thumbnail`}
                          loading="lazy"
                          style={{ width: 96, height: 60, borderRadius: 6, objectFit: 'cover', background: '#f4f4f4', flexShrink: 0 }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 96,
                            height: 60,
                            borderRadius: 6,
                            background: '#f1f1f1',
                            color: '#888',
                            fontSize: 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          No image
                        </div>
                      )}
                      <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.name}</strong>
                    </div>

                    <button
                      onClick={() => removeFavorite(it.id)}
                      disabled={!!removing[it.id]}
                      style={{
                        background: 'none',
                        border: '1px solid #d8d8d8',
                        padding: '7px 11px',
                        borderRadius: 7,
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      {removing[it.id] ? 'Removing...' : 'Remove'}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}