"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

type PresetProgram = {
  id: string;
  title: string;
  frequency?: string;
  hep?: Exercise[];
};

export default function PresetProgramDetailPage() {
  const params = useParams<{ presetId: string }>();
  const presetId = params?.presetId;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState("");
  const [query, setQuery] = useState("");
  const [libraryResults, setLibraryResults] = useState<Exercise[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hep, setHep] = useState<Exercise[]>([]);
  const [libMode, setLibMode] = useState<"library" | "my">("library");
  const searchDeb = useRef<any>(null);

  useEffect(() => {
    if (!presetId) return;
    setLoading(true);
    setError(null);

    fetch(`${BACKEND}/therapists/${encodeURIComponent(THERAPIST_ID)}/preset-programs/${encodeURIComponent(presetId)}`, {
      credentials: "include",
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("Preset program not found");
        return r.json();
      })
      .then((data: PresetProgram) => {
        setTitle(data?.title || "");
        setFrequency(data?.frequency || "");
        setHep(Array.isArray(data?.hep) ? data.hep : []);
      })
      .catch((e: any) => setError(String(e?.message || e)))
      .finally(() => setLoading(false));
  }, [presetId]);

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

  async function savePreset() {
    const trimmed = title.trim();
    if (!presetId || !trimmed) {
      setError("Preset title is required.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND}/therapists/${encodeURIComponent(THERAPIST_ID)}/preset-programs/${encodeURIComponent(presetId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: trimmed, frequency: frequency || undefined, hep }),
      });
      if (!res.ok) throw new Error("Failed to update preset program");
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
        <h2>Edit Preset Program</h2>
        <div style={{ color: "#666", marginBottom: 12 }}>Review and update this preset template.</div>

        {loading && <div>Loading preset...</div>}
        {error && <div style={{ color: "crimson", marginBottom: 10 }}>{error}</div>}

        {!loading && (
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
                onClick={savePreset}
                disabled={saving}
                style={{ background: "#007da4", color: "white", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer" }}
              >
                {saving ? "Saving..." : "Save Changes"}
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
        )}
      </div>
    </div>
  );
}
