"use client";

import { useState, FormEvent, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Header from "../components/TherapistHeader";

type Exercise = {
  id: number;
  name: string;
  category?: string;
  description?: string;
};

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function NewHEP() {
  const searchParams = useSearchParams();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contact, setContact] = useState("");

  const [exerciseName, setExerciseName] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [query, setQuery] = useState("");

  // results from backend library
  const [libraryResults, setLibraryResults] = useState<Exercise[]>([]);

  useEffect(() => {
    // prefill from query params when navigating from therapist dashboard
    try {
      const fn = searchParams?.get?.("firstName");
      const ln = searchParams?.get?.("lastName");
      const c = searchParams?.get?.("contact");
      if (fn) setFirstName(fn);
      if (ln) setLastName(ln);
      if (c) setContact(c);
    } catch (e) {
      // ignore
    }

    // optional: warm cache of library on mount
    fetch(`${BACKEND}/exercises`)
      .then((r) => r.json())
      .catch(() => {});
  }, []);

  // debounce search against backend when query changes
  useEffect(() => {
    if (!query) {
      setLibraryResults([]);
      return;
    }

    const t = setTimeout(() => {
      fetch(`${BACKEND}/exercises/search?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((data) => setLibraryResults(data))
        .catch(() => setLibraryResults([]));
    }, 300);

    return () => clearTimeout(t);
  }, [query]);

  function addExercise(e?: FormEvent) {
    e?.preventDefault?.();
    const name = exerciseName.trim();
    if (!name) return;
    setExercises((prev) => [{ id: Date.now(), name }, ...prev]);
    setExerciseName("");
    setQuery("");
    setLibraryResults([]);
  }

  function addExerciseFromLibrary(item: Exercise) {
    // avoid duplicates by name
    setExercises((prev) => (prev.some((p) => p.name === item.name) ? prev : [{ id: Date.now(), name: item.name, category: item.category, description: item.description }, ...prev]));
    setQuery("");
    setLibraryResults([]);
  }

  function removeExercise(id: number) {
    setExercises((prev) => prev.filter((x) => x.id !== id));
  }

  const filteredLocal = exercises.filter((ex) => ex.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="main">
      <Header />
      <div className="content">
        <h2>New HEP</h2>

        <form className="patient-form" onSubmit={(e) => e.preventDefault()}>
          <div className="row">
            <label>
              First name
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
              />
            </label>
            <label>
              Last name
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
              />
            </label>
          </div>

          <label>
            Email / Contact
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Email or phone"
            />
          </label>
        </form>

        <section className="exercises">
          <h3>Exercises</h3>

          <div className="exercise-search">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search exercises (local + library)"
            />
          </div>

          {/* show library results from backend */}
          {libraryResults.length > 0 && (
            <div style={{ marginBottom: 12, width: '100%', maxWidth: 900 }}>
              <strong>Library results</strong>
              <div style={{ border: '1px solid #eee', padding: 8, borderRadius: 8 }}>
                {libraryResults.map((it) => (
                  <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{it.name}</div>
                      {it.category && <div style={{ fontSize: 12, color: '#666' }}>{it.category}</div>}
                    </div>
                    <div>
                      <button onClick={() => addExerciseFromLibrary(it)} style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: '#007da4', color: 'white', cursor: 'pointer' }}>Add</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="exercise-list" style={{ border: "1px solid #ddd", padding: 12, maxHeight: 320, overflow: "auto", width: '100%', maxWidth: 900 }}>
            {filteredLocal.length === 0 ? (
              <p style={{ color: "#666" }}>No exercises added.</p>
            ) : (
              filteredLocal.map((ex) => (
                <div key={ex.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f0f0f0" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{ex.name}</div>
                    {ex.description && <div style={{ fontSize: 12, color: '#666' }}>{ex.description}</div>}
                  </div>
                  <button onClick={() => removeExercise(ex.id)} aria-label={`Remove ${ex.name}`} style={{ color: "#c00", background: "none", border: "none", cursor: "pointer" }}>
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}