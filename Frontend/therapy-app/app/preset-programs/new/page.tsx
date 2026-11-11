"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/TherapistHeader";
import ExercisePicker from "../../components/ExercisePicker";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
const THERAPIST_ID = process.env.NEXT_PUBLIC_THERAPIST_ID || "therapist1";

type Exercise = {
  id: number;
  name: string;
  category?: string;
  description?: string;
  mediaUrl?: string;
  mediaType?: string;
  thumbnailUrl?: string;
  sets?: number;
  reps?: number;
};

export default function NewPresetProgramPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState("");
  const [query, setQuery] = useState("");
  const [libraryResults, setLibraryResults] = useState<Exercise[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hep, setHep] = useState<Exercise[]>([]);
  const [libMode, setLibMode] = useState<"library" | "my">("library");
  const [saving, setSaving] = useState(false);
  const searchDeb = useRef<any>(null);

  useEffect(() => {
    if (!query) {
      setLibraryResults([]);
      setSearchLoading(false);
      return;
    }

    if (searchDeb.current) window.clearTimeout(searchDeb.current);
    setSearchLoading(true);
    searchDeb.current = window.setTimeout(() => {
      if (libMode === "library") {
        fetch(`${BACKEND}/exercises/search?q=${encodeURIComponent(query)}`, { credentials: "include" })
          .then((r) => r.json())
          .then((data) => setLibraryResults(Array.isArray(data) ? data : []))
          .catch(() => setLibraryResults([]))
          .finally(() => setSearchLoading(false));
      } else {
        fetch(`${BACKEND}/therapists/${encodeURIComponent(THERAPIST_ID)}/favorites`, { credentials: "include" })
          .then((r) => r.json())
          .then((data) => {
            const arr = Array.isArray(data) ? data : [];
            const filtered = arr.filter((ex: Exercise) => ex.name.toLowerCase().includes(query.toLowerCase()));
            setLibraryResults(filtered);
          })
          .catch(() => setLibraryResults([]))
          .finally(() => setSearchLoading(false));
      }
    }, 300);

    return () => {
      if (searchDeb.current) window.clearTimeout(searchDeb.current);
    };
  }, [query, libMode]);

  function addExercise() {
    const name = (query || "").trim();
    if (!name) return;
    const newEx = { id: Date.now(), name, sets: 3, reps: 10 } as Exercise;
    setHep((prev) => (prev.some((x) => x.name === newEx.name) ? prev : [newEx, ...prev]));
    setQuery("");
    setLibraryResults([]);
  }

  function addExerciseFromLibrary(it: Exercise) {
    const newEx = {
      id: Date.now(),
      name: it.name,
      category: it.category,
      description: it.description,
      mediaUrl: it.mediaUrl,
      mediaType: it.mediaType,
      thumbnailUrl: it.thumbnailUrl,
      sets: 3,
      reps: 10,
    } as Exercise;
    setHep((prev) => (prev.some((x) => x.name === newEx.name) ? prev : [newEx, ...prev]));
    setQuery("");
    setLibraryResults([]);
  }

  async function createPreset() {
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Preset title is required.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND}/therapists/${encodeURIComponent(THERAPIST_ID)}/preset-programs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: trimmed, frequency: frequency || undefined, hep }),
      });
      if (!res.ok) throw new Error("Failed to create preset program");
      router.push("/preset-programs");
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="main">
      <Header />
      <div className="content" style={{ width: "100%", maxWidth: 960, alignItems: "stretch" }}>
        <h2>Create Preset Program</h2>
        <div style={{ color: "#666", marginBottom: 12 }}>Build a reusable program template.</div>

        {error && <div style={{ color: "crimson", marginBottom: 10 }}>{error}</div>}

        <section style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, marginBottom: 16, background: "#fff" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              placeholder="Preset title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ padding: "8px 10px", border: "1px solid #ccc", borderRadius: 6, flex: 1 }}
            />
          </div>

          <ExercisePicker
            libMode={libMode}
            setLibMode={setLibMode}
            query={query}
            setQuery={setQuery}
            libraryResults={libraryResults}
            searchLoading={searchLoading}
            addExercise={addExercise}
            addExerciseFromLibrary={addExerciseFromLibrary}
            displayedExercises={hep}
            defaultSets={3}
            defaultReps={10}
            setDefaultSets={() => {}}
            setDefaultReps={() => {}}
            updateSets={(id: number, v: number) => setHep((prev) => prev.map((x: any) => x.id === id ? ({ ...x, sets: v }) : x))}
            updateReps={(id: number, v: number) => setHep((prev) => prev.map((x: any) => x.id === id ? ({ ...x, reps: v }) : x))}
            removeExercise={(id: number) => setHep((prev) => prev.filter((x: any) => x.id !== id))}
            frequency={frequency}
            setFrequency={setFrequency}
          />

          <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={createPreset}
              disabled={saving}
              style={{ background: "#007da4", color: "white", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer" }}
            >
              {saving ? "Saving..." : "Save Preset Program"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/preset-programs")}
              style={{ background: "#eee", color: "#222", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
