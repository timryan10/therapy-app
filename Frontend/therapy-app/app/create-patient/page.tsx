"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/TherapistHeader";

type Exercise = {
  id: number;
  name: string;
  category?: string;
  description?: string;
};

type CaseItem = {
  id: string | number;
  title: string;
  bodyParts: string[];
  notes?: string;
  hep?: Exercise[];
};

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function CreatePatient() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contact, setContact] = useState("");
  const [birthdate, setBirthdate] = useState("");
  // create-patient is only for creating new patients; do not prefill from query
  const [savingPatient, setSavingPatient] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const router = useRouter();

  const [exerciseName, setExerciseName] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [query, setQuery] = useState("");
  const [libraryResults, setLibraryResults] = useState<Exercise[]>([]);

  const [cases, setCases] = useState<CaseItem[]>([]);
  const [caseTitle, setCaseTitle] = useState("");
  const [caseBodyParts, setCaseBodyParts] = useState("");
  const [caseNotes, setCaseNotes] = useState("");
  // if a case title is entered on the form, exercises will be attached to that pending case
  const [pendingCaseHep, setPendingCaseHep] = useState<Exercise[]>([]);

  useEffect(() => {
    // warm cache of library on mount
    fetch(`${BACKEND}/exercises`).then((r) => r.json()).catch(() => {});
  }, []);

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

  function addExercise(e?: FormEvent, nameArg?: string) {
    e?.preventDefault?.();
    const name = (nameArg || exerciseName || query).trim();
    if (!name) return;
    const newEx: Exercise = { id: Date.now(), name };
    // if therapist has started entering a case title, attach to the pending case
    if (caseTitle.trim() !== '') {
      setPendingCaseHep((prev) => (prev.some((p) => p.name === newEx.name) ? prev : [newEx, ...prev]));
    } else {
      setExercises((prev) => (prev.some((p) => p.name === newEx.name) ? prev : [newEx, ...prev]));
    }
    setExerciseName("");
    setQuery("");
    setLibraryResults([]);
  }

  function addExerciseFromLibrary(item: Exercise) {
    const newEx: Exercise = { id: Date.now(), name: item.name, category: item.category, description: item.description };
    if (caseTitle.trim() !== '') {
      setPendingCaseHep((prev) => (prev.some((p) => p.name === newEx.name) ? prev : [newEx, ...prev]));
    } else {
      setExercises((prev) => (prev.some((p) => p.name === newEx.name) ? prev : [newEx, ...prev]));
    }
    setQuery("");
    setLibraryResults([]);
  }

  function removeExercise(id: number) {
    setExercises((prev) => prev.filter((x) => x.id !== id));
  }

  function removeCaseExercise(caseId: string | number, exId: number) {
    setCases((prev) => prev.map((c) => {
      if (String(c.id) === String(caseId)) {
        return { ...c, hep: (c.hep || []).filter((h) => h.id !== exId) };
      }
      return c;
    }));
  }

  function removePendingCaseExercise(exId: number) {
    setPendingCaseHep((prev) => prev.filter((h) => h.id !== exId));
  }

  function addCase(e?: FormEvent) {
    // kept for compatibility but not used in single-submit flow
    // prefer adding a pending case by filling title/bodyParts and adding exercises, then submitting
    return;
  }

  function removeCase(id: string | number) {
    setCases((prev) => prev.filter((c) => String(c.id) !== String(id)));
  }

  // Show the full list of added exercises (for the pending case or patient HEP).
  // We avoid filtering this list by the search `query` so therapists always see
  // what they've already added while they search the library.
  const displayedExercises = (caseTitle.trim() !== '' ? pendingCaseHep : exercises);

  return (
    <div className="main">
      <Header />
      <div className="content">
        <h2>Create Patient</h2>

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

          <label>
            Birthdate
            <input
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              placeholder="YYYY-MM-DD"
            />
          </label>
        </form>

        <section style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <h3>HEP Title/ Case: </h3>
            <input placeholder="Case title" value={caseTitle} onChange={(e) => setCaseTitle(e.target.value)} />
            <input placeholder="Body parts (comma separated)" value={caseBodyParts} onChange={(e) => setCaseBodyParts(e.target.value)} />
          </div>
        </section>

        <section className="exercises" style={{ marginTop: 18 }}>
          <h3>Exercises</h3>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addExercise();
                  }
                }}
                placeholder="Search exercises (local + library)"
              />
            </div>
            <div style={{ padding: '6px 8px', color: '#666', fontSize: 13 }}>
              {caseTitle.trim() !== '' ? `Adding exercises to new case: ${caseTitle}` : 'Adding exercises to patient HEP'}
            </div>
          </div>

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
            {displayedExercises.length === 0 ? (
              <p style={{ color: "#666" }}>No exercises added.</p>
            ) : (
              displayedExercises.map((ex) => (
                <div key={ex.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f0f0f0" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{ex.name}</div>
                    {ex.description && <div style={{ fontSize: 12, color: '#666' }}>{ex.description}</div>}
                    {caseTitle.trim() !== '' && <div style={{ fontSize: 12, color: '#666' }}>Will be added to new case</div>}
                  </div>
                  <button onClick={() => { if (caseTitle.trim() !== '') removePendingCaseExercise(ex.id); else removeExercise(ex.id); }} aria-label={`Remove ${ex.name}`} style={{ color: "#c00", background: "none", border: "none", cursor: "pointer" }}>
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>

          <div style={{ marginTop: 12, marginBottom: 12 }}>
            <button
              onClick={async () => {
                setSaveError(null);
                setSavingPatient(true);
                try {
                  // include any pending (not-yet-added) case in the payload
                  const finalCases = [...cases];
                  if (caseTitle.trim() !== '' || pendingCaseHep.length > 0) {
                    const bodyParts = caseBodyParts.split(',').map((s) => s.trim()).filter(Boolean);
                    const newCase = { id: `case-${Date.now()}`, title: caseTitle.trim() || 'hep program', bodyParts, notes: caseNotes || '', hep: pendingCaseHep };
                    finalCases.unshift(newCase);
                  }

                  const payload: any = { firstName, lastName, contact, birthdate, hep: exercises, cases: finalCases };
                  // always create a new patient from this page
                  const res = await fetch(`${BACKEND}/patients`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                  });
                                if (!res.ok) throw new Error('Failed to create patient');
                                const created = await res.json();
                                router.push(`/patients/${created.id}`);
                } catch (e: any) {
                  setSaveError(String(e?.message || e));
                } finally {
                  setSavingPatient(false);
                }
              }}
              style={{ padding: '8px 12px', background: '#007da4', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}
              disabled={savingPatient}
            >
              {savingPatient ? 'Saving...' : 'Create Patient'}
            </button>
            <button
              onClick={() => router.push('/therapist-dashboard')}
              style={{ padding: '8px 12px', marginLeft: 8, background: '#eee', color: '#222', border: 'none', borderRadius: 8, cursor: 'pointer' }}
            >
              Back to Dashboard
            </button>
            {saveError && <div style={{ color: 'red', marginTop: 8 }}>{saveError}</div>}
          </div>
        </section>
      </div>
    </div>
  );
}
