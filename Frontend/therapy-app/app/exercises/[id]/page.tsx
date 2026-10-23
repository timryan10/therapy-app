"use client";

import Header from "../../components/TherapistHeader";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

type Exercise = {
  id: number | string;
  name: string;
  description?: string;
  mediaUrl?: string;
  mediaType?: string;
};

export default function ExercisePreviewPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const THERAPIST_ID = process.env.NEXT_PUBLIC_THERAPIST_ID || "therapist1";

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`${BACKEND}/exercises`, { cache: "no-store" }),
      fetch(`${BACKEND}/therapists/${encodeURIComponent(THERAPIST_ID)}/favorites`, { cache: "no-store" }),
    ])
      .then(async ([exRes, favRes]) => {
        if (!exRes.ok) throw new Error("Could not load exercise library.");
        const list: Exercise[] = await exRes.json();
        const found = list.find((x) => String(x.id) === String(id)) || null;
        setExercise(found);

        if (favRes.ok && found) {
          const favs = await favRes.json();
          if (Array.isArray(favs)) {
            setSaved(favs.some((f: any) => String(f.id) === String(found.id) || f.name === found.name));
          }
        }
      })
      .catch((e: any) => setError(e?.message || "Failed to load exercise preview."))
      .finally(() => setLoading(false));
  }, [id, THERAPIST_ID]);

  const mediaSrc = useMemo(() => {
    if (!exercise?.mediaUrl) return "";
    return exercise.mediaUrl.startsWith("/uploads/") ? `${BACKEND}${exercise.mediaUrl}` : exercise.mediaUrl;
  }, [exercise]);

  const isVideo = useMemo(() => {
    const url = exercise?.mediaUrl || "";
    const byType = (exercise?.mediaType || "").toLowerCase().startsWith("video/");
    const byExt = /\.(mp4|webm|ogg|mov|m4v)$/i.test(url);
    const hasKnownImageExt = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(url);
    const unknownNoExt = !!url && !byExt && !hasKnownImageExt && !(exercise?.mediaType || "");
    return byType || byExt || unknownNoExt;
  }, [exercise]);

  const onSave = async () => {
    if (!exercise || saved || saving) return;
    setSaveError(null);
    setSaving(true);
    try {
      const r = await fetch(`${BACKEND}/therapists/${encodeURIComponent(THERAPIST_ID)}/favorites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exercise),
      });
      if (r.status === 409) {
        setSaved(true);
        return;
      }
      if (!r.ok) throw new Error("Failed to save to library");
      setSaved(true);
    } catch (e: any) {
      setSaveError(e?.message || "Failed to save to library");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="main">
      <Header />
      <div className="content" style={{ width: "100%", maxWidth: 900 }}>
        <h2>Exercise Preview</h2>
        <div style={{ color: "#666", marginBottom: 12 }}>This is how the exercise appears to patients.</div>

        {loading && <div>Loading exercise...</div>}
        {!loading && error && <div style={{ color: "crimson" }}>{error}</div>}

        {!loading && !error && !exercise && (
          <div style={{ color: "#666", marginBottom: 12 }}>Exercise not found.</div>
        )}

        {!loading && !error && exercise && (
          <div style={{ border: "1px solid #eaeaea", borderRadius: 10, padding: 14, width: "100%", background: "#fff" }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>{exercise.name}</div>

            {mediaSrc ? (
              isVideo ? (
                <video
                  src={mediaSrc}
                  controls
                  style={{ width: "100%", maxWidth: 560, borderRadius: 8, background: "#000" }}
                  preload="metadata"
                  playsInline
                />
              ) : (
                <img
                  src={mediaSrc}
                  alt={exercise.name}
                  style={{ width: "100%", maxWidth: 560, borderRadius: 8, objectFit: "cover" }}
                />
              )
            ) : (
              <div style={{ color: "#666" }}>No media attached.</div>
            )}

            <div style={{ marginTop: 14 }}>
              <h3 style={{ margin: "0 0 8px 0" }}>Description</h3>
              <div style={{ color: "#444" }}>{exercise.description?.trim() || "No description provided."}</div>
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center" }}>
              <button
                onClick={onSave}
                disabled={saved || saving}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "none",
                  background: saved ? "#6c757d" : "#007da4",
                  color: "#fff",
                  cursor: saved ? "default" : "pointer",
                }}
              >
                {saved ? "Saved" : saving ? "Saving..." : "Save to My Library"}
              </button>
              {saveError && <div style={{ color: "crimson", fontSize: 13 }}>{saveError}</div>}
            </div>
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <Link href="/exercises" style={{ color: "#007da4", textDecoration: "none" }}>← Back to Exercise Library</Link>
        </div>
      </div>
    </div>
  );
}
