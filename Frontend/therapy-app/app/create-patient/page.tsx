"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/TherapistHeader";
import ExercisePicker from "../components/ExercisePicker";

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
  const [libMode, setLibMode] = useState<'library' | 'my'>('library');

  const [cases, setCases] = useState<CaseItem[]>([]);
  const [caseTitle, setCaseTitle] = useState("");
  const [caseBodyParts, setCaseBodyParts] = useState("");
  const [caseNotes, setCaseNotes] = useState("");
  const [caseFrequency, setCaseFrequency] = useState("");
  const [caseDefaultSets, setCaseDefaultSets] = useState<number>(3);
  const [caseDefaultReps, setCaseDefaultReps] = useState<number>(10);
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
      if (libMode === 'library') {
        fetch(`${BACKEND}/exercises/search?q=${encodeURIComponent(query)}`)
          .then((r) => r.json())
          .then((data) => setLibraryResults(Array.isArray(data) ? data : []))
          .catch(() => setLibraryResults([]));
      } else {
        // My Library: fetch therapist favorites then filter client-side
        fetch(`${BACKEND}/therapists/therapist1/favorites`)
          .then((r) => r.json())
          .then((data) => {
            const arr = Array.isArray(data) ? data : [];
            const filtered = arr.filter((ex: Exercise) => ex.name.toLowerCase().includes(query.toLowerCase()));
            setLibraryResults(filtered);
          })
          .catch(() => setLibraryResults([]));
      }
    }, 300);

    return () => clearTimeout(t);
  }, [query, libMode]);

  function addExercise(e?: FormEvent, nameArg?: string) {
    e?.preventDefault?.();
    const name = (nameArg || exerciseName || query).trim();
    if (!name) return;
    const newEx: Exercise = { id: Date.now(), name, sets: caseDefaultSets, reps: caseDefaultReps } as any;
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
    const newEx: Exercise = { id: Date.now(), name: item.name, category: item.category, description: item.description, sets: caseDefaultSets, reps: caseDefaultReps } as any;
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
                style={{ padding: '6px 8px', border: '1px solid #ccc', borderRadius: 6 }}
              />
            </label>
            <label>
              Last name
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                style={{ padding: '6px 8px', border: '1px solid #ccc', borderRadius: 6 }}
              />
            </label>
          </div>

          <label>
            Email / Contact
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Email or phone"
              style={{ padding: '6px 8px', border: '1px solid #ccc', borderRadius: 6 }}
            />
          </label>

          <label>
            Birthdate
            <input
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              placeholder="YYYY-MM-DD"
              style={{ padding: '6px 8px', border: '1px solid #ccc', borderRadius: 6 }}
            />
          </label>
        </form>

        <section className="exercises" style={{ marginTop: 18 }}>
          <h3>Exercises</h3>

          <ExercisePicker
            libMode={libMode}
            setLibMode={setLibMode}
            query={query}
            setQuery={setQuery}
            libraryResults={libraryResults}
            addExercise={addExercise}
            addExerciseFromLibrary={addExerciseFromLibrary}
            displayedExercises={displayedExercises}
            isPending={caseTitle.trim() !== ''}
            defaultSets={caseDefaultSets}
            defaultReps={caseDefaultReps}
            setDefaultSets={setCaseDefaultSets}
            setDefaultReps={setCaseDefaultReps}
            caseTitle={caseTitle}
            setCaseTitle={setCaseTitle}
            caseBodyParts={caseBodyParts}
            setCaseBodyParts={setCaseBodyParts}
            updateSets={(id, v) => {
              if (caseTitle.trim() !== '') setPendingCaseHep((prev) => prev.map((p) => p.id === id ? ({ ...p, sets: v }) : p));
              else setExercises((prev) => prev.map((p) => p.id === id ? ({ ...p, sets: v }) : p));
            }}
            updateReps={(id, v) => {
              if (caseTitle.trim() !== '') setPendingCaseHep((prev) => prev.map((p) => p.id === id ? ({ ...p, reps: v }) : p));
              else setExercises((prev) => prev.map((p) => p.id === id ? ({ ...p, reps: v }) : p));
            }}
            removeExercise={(id) => removeExercise(id)}
            removePendingExercise={(id) => removePendingCaseExercise(id)}
            frequency={caseFrequency}
            setFrequency={setCaseFrequency}
          />

          <div style={{ marginTop: 12, marginBottom: 12 }}>
            <button
              onClick={async () => {
                setSaveError(null);
                setSavingPatient(true);
                try {
                  // include any pending (not-yet-added) case in the payload
                  const finalCases = [...cases];

                  // If therapist entered a case title or added pendingCaseHep, create a case using pendingCaseHep.
                  if (caseTitle.trim() !== '' || pendingCaseHep.length > 0) {
                    const bodyParts = caseBodyParts.split(',').map((s) => s.trim()).filter(Boolean);
                      const newCase = { id: `case-${Date.now()}`, title: caseTitle.trim() || 'HEP Program', bodyParts, notes: caseNotes || '', frequency: caseFrequency || undefined, hep: pendingCaseHep };
                    finalCases.unshift(newCase);
                    // keep top-level exercises separate
                    const payload: any = { firstName, lastName, contact, birthdate, hep: exercises, cases: finalCases };
                    const res = await fetch(`${BACKEND}/patients`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload)
                    });
                    if (!res.ok) throw new Error('Failed to create patient');
                    const created = await res.json();
                    router.push(`/patients/${created.id}`);
                    return;
                  }

                  // If no case title and no pendingCaseHep but therapist added exercises,
                  // create a default case titled 'HEP Program' containing those exercises,
                  // and do not duplicate them at top-level `hep`.
                  if (caseTitle.trim() === '' && pendingCaseHep.length === 0 && exercises.length > 0) {
                    const bodyParts = caseBodyParts.split(',').map((s) => s.trim()).filter(Boolean);
                    const newCase = { id: `case-${Date.now()}`, title: 'HEP Program', bodyParts, notes: caseNotes || '', frequency: caseFrequency || undefined, hep: exercises };
                    finalCases.unshift(newCase);
                    const payload: any = { firstName, lastName, contact, birthdate, hep: [], cases: finalCases };
                    const res = await fetch(`${BACKEND}/patients`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload)
                    });
                    if (!res.ok) throw new Error('Failed to create patient');
                    const created = await res.json();
                    router.push(`/patients/${created.id}`);
                    return;
                  }

                  // Default: no cases and no exercises to attach
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
