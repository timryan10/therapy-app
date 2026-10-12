"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ExercisePicker from "../../components/ExercisePicker";

type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  contact?: string;
  birthdate?: string;
  lastVisit?: string;
  notes?: string;
  hep?: any[];
  cases?: {
    id: string | number;
    title: string;
    bodyParts: string[];
    notes?: string;
  }[];
};

type Exercise = {
  id: number;
  name: string;
  category?: string;
  description?: string;
};

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function PatientClient({ patient, exercises }: { patient: Patient; exercises: Exercise[] }) {
  const router = useRouter();

  // local cases state (start from server-passed patient)
  const [cases, setCases] = useState(patient.cases || []);

  // state for creating a new HEP program (case)
  const [showNewCase, setShowNewCase] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBodyParts, setNewBodyParts] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newHep, setNewHep] = useState<Exercise[]>([]);
  const [newFrequency, setNewFrequency] = useState("");
  const [newDefaultSets, setNewDefaultSets] = useState<number>(3);
  const [newDefaultReps, setNewDefaultReps] = useState<number>(10);

  // search for exercises to add to the new case
  const [query, setQuery] = useState("");
  const [libraryResults, setLibraryResults] = useState<Exercise[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchDeb = useRef<any>(null);
  const [libMode, setLibMode] = useState<'library' | 'my'>('library');

  useEffect(() => {
    if (!query) {
      setLibraryResults([]);
      setSearchLoading(false);
      return;
    }
    if (searchDeb.current) window.clearTimeout(searchDeb.current);
    setSearchLoading(true);
    searchDeb.current = window.setTimeout(() => {
      if (libMode === 'library') {
        fetch(`${BACKEND}/exercises/search?q=${encodeURIComponent(query)}`)
          .then((r) => r.json())
          .then((data) => setLibraryResults(Array.isArray(data) ? data : []))
          .catch(() => setLibraryResults([]))
          .finally(() => setSearchLoading(false));
      } else {
        // My Library: fetch therapist favorites then filter client-side
        fetch(`${BACKEND}/therapists/therapist1/favorites`)
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
    return () => { if (searchDeb.current) window.clearTimeout(searchDeb.current); };
  }, [query, libMode]);

  return (
    <div>
      <button onClick={() => router.back()} style={{ marginBottom: 12 }}>← Back</button>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{patient.firstName} {patient.lastName}</div>
            {patient.contact && <div style={{ color: '#666' }}>{patient.contact}</div>}
          </div>
          <div style={{ marginTop: 8 }}>
            {patient.birthdate && <div>Birthdate: {patient.birthdate}</div>}
          </div>
        </div>
        {/* Edit and Back buttons moved to bottom of the page for a cleaner view */}
      </div>

      <div style={{ fontSize: 13, marginBottom: 12 }}>Last visit: {patient.lastVisit}</div>
      <div style={{ marginBottom: 12 }}>{patient.notes}</div>

      <div style={{ marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>Cases</h3>
        {(cases.length === 0) ? (
          <div style={{ color: '#666', marginTop: 8 }}>No cases assigned for this patient.</div>
        ) : (
          <div style={{ marginTop: 8, border: '1px solid #eee', padding: 8, borderRadius: 8 }}>
            {cases.map((c) => (
              <div key={String(c.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #ddd' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <div style={{ fontWeight: 600 }}>{c.title}</div>
                    {c.bodyParts && c.bodyParts.length > 0 && (
                      <div style={{ color: '#666', fontSize: 13 }}>{c.bodyParts.join(', ')}</div>
                    )}
                  </div>
                </div>
                <div>
                  <button onClick={() => router.push(`/patients/${patient.id}/cases/${c.id}`)} style={{ background: '#007da4', color: 'white', border: 'none', padding: '6px 10px', borderRadius: 6 }}>View Exercises</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New HEP creation UI */}
        <div style={{ marginTop: 12 }}>
          {!showNewCase ? (
            <button onClick={() => setShowNewCase(true)} style={{ padding: '8px 10px', borderRadius: 6, background: '#007da4', color: 'white', border: 'none' }}>+ Add HEP Program</button>
          ) : (
            <div style={{ marginTop: 8, border: '1px solid #eee', padding: 12, borderRadius: 8, maxWidth: 900 }}>
              {/* Program title/bodyParts moved into ExercisePicker */}
    
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>Add exercises to this program</div>
                <ExercisePicker
                  libMode={libMode}
                  setLibMode={setLibMode}
                  query={query}
                  setQuery={setQuery}
                  libraryResults={libraryResults}
                  searchLoading={searchLoading}
                  addExercise={() => {
                    const name = (query || '').trim();
                    if (!name) return;
                    const newEx = { id: Date.now(), name, sets: newDefaultSets, reps: newDefaultReps } as any;
                    setNewHep((p) => (p.some((x) => x.name === newEx.name) ? p : [newEx, ...p]));
                    setQuery(''); setLibraryResults([]);
                  }}
                  addExerciseFromLibrary={(it: any) => { const newEx = { id: Date.now(), name: it.name, category: it.category, description: it.description, sets: newDefaultSets, reps: newDefaultReps } as any; setNewHep((p) => (p.some((x) => x.name === newEx.name) ? p : [newEx, ...p])); setQuery(''); setLibraryResults([]); }}
                  displayedExercises={newHep}
                  defaultSets={newDefaultSets}
                  defaultReps={newDefaultReps}
                  setDefaultSets={setNewDefaultSets}
                  setDefaultReps={setNewDefaultReps}
                  updateSets={(id: number, v: number) => setNewHep((p) => p.map((x) => x.id === id ? ({ ...x, sets: v }) : x))}
                  updateReps={(id: number, v: number) => setNewHep((p) => p.map((x) => x.id === id ? ({ ...x, reps: v }) : x))}
                  removeExercise={(id: number) => setNewHep((p) => p.filter((x) => x.id !== id))}
                  frequency={newFrequency}
                  setFrequency={setNewFrequency}
                  caseTitle={newTitle}
                  setCaseTitle={setNewTitle}
                  caseBodyParts={newBodyParts}
                  setCaseBodyParts={setNewBodyParts}
                />
              </div>

              <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                <button onClick={async () => {
                  // allow empty title and default to 'HEP Program'
                  const title = newTitle.trim() || 'HEP Program';
                  const bodyParts = newBodyParts.split(',').map((s) => s.trim()).filter(Boolean);
                  const payload = { title, bodyParts, notes: newNotes || '', frequency: newFrequency || undefined, hep: newHep };
                  try {
                    const res = await fetch(`${BACKEND}/patients/${encodeURIComponent(patient.id)}/cases`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                    if (!res.ok) throw new Error('Failed to create case');
                    const created = await res.json();
                    setCases((prev) => [...prev, created]);
                    // reset form
                    setShowNewCase(false);
                    setNewTitle(''); setNewBodyParts(''); setNewNotes(''); setNewHep([]);
                  } catch (e: any) {
                    alert(String(e?.message || e));
                  }
                }} style={{ padding: '8px 12px', background: '#007da4', color: 'white', border: 'none', borderRadius: 8 }}>Create Program</button>
                <button onClick={() => setShowNewCase(false)} style={{ padding: '8px 12px', background: '#eee', color: '#222', border: 'none', borderRadius: 8 }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div style={{ marginTop: 18, display: 'flex', gap: 8 }}>
        <Link href={`/patients/${patient.id}/edit`}>
          <button style={{ padding: '8px 12px', background: '#eee', color: '#222', border: 'none', borderRadius: 8 }}>Edit Patient</button>
        </Link>
        <button onClick={() => router.push('/therapist-dashboard')} style={{ background: '#eee', color: '#222', border: 'none', padding: '8px 12px', borderRadius: 8 }}>Back to Dashboard</button>
      </div>
    </div>
  );
}
