"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from 'next/navigation';
import ExercisePicker from '../../../components/ExercisePicker';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function EditCaseClient({ patientId, caseData }: { patientId: string; caseData: any }) {
  const router = useRouter();
  const [title] = useState(caseData.title || '');
  const [bodyParts, setBodyParts] = useState((caseData.bodyParts || []).join(', '));
  const [frequency, setFrequency] = useState(caseData.frequency || '');
  const [hep, setHep] = useState((caseData.hep || []).map((h: any) => ({ ...h })));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // search state for ExercisePicker
  const [libMode, setLibMode] = useState<'library' | 'my'>('library');
  const [query, setQuery] = useState('');
  const [libraryResults, setLibraryResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
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
      if (libMode === 'library') {
        fetch(`${BACKEND}/exercises/search?q=${encodeURIComponent(query)}`)
          .then((r) => r.json())
          .then((data) => setLibraryResults(Array.isArray(data) ? data : []))
          .catch(() => setLibraryResults([]))
          .finally(() => setSearchLoading(false));
      } else {
        fetch(`${BACKEND}/therapists/therapist1/favorites`)
          .then((r) => r.json())
          .then((data) => {
            const arr = Array.isArray(data) ? data : [];
            const filtered = arr.filter((ex: any) => ex.name.toLowerCase().includes(query.toLowerCase()));
            setLibraryResults(filtered);
          })
          .catch(() => setLibraryResults([]))
          .finally(() => setSearchLoading(false));
      }
    }, 300);
    return () => { if (searchDeb.current) window.clearTimeout(searchDeb.current); };
  }, [query, libMode]);

  function updateExercise(id: number|string, field: 'sets'|'reps', value: number) {
    setHep((prev: any[]) => prev.map((e: any) => String(e.id) === String(id) ? ({ ...e, [field]: value }) : e));
  }

  function addExercise(e?: any, nameArg?: string) {
    const name = (nameArg || query || '').trim();
    if (!name) return;
    const newEx = { id: Date.now(), name, sets: 3, reps: 10 } as any;
    setHep((p) => (p.some((x: any) => x.name === newEx.name) ? p : [newEx, ...p]));
    setQuery(''); setLibraryResults([]);
  }

  function addExerciseFromLibrary(item: any) {
    const newEx = { id: Date.now(), name: item.name, category: item.category, description: item.description, sets: 3, reps: 10 } as any;
    setHep((p) => (p.some((x: any) => x.name === newEx.name) ? p : [newEx, ...p]));
    setQuery(''); setLibraryResults([]);
  }

  function removeExercise(id: number) {
    setHep((p) => p.filter((x) => x.id !== id));
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    const bodyPartsArr = bodyParts.split(',').map((s: string) => s.trim()).filter(Boolean);
    const payload = { title, bodyParts: bodyPartsArr, frequency: frequency || undefined, hep };
    try {
      const res = await fetch(`${BACKEND}/patients/${encodeURIComponent(patientId)}/cases/${encodeURIComponent(caseData.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save case');
      const updated = await res.json();
      setMessage('Saved');
      setHep((updated.hep || []).map((h: any) => ({ ...h })));
      router.push(`/patients/${encodeURIComponent(patientId)}`);
    } catch (err: any) {
      setMessage(String(err?.message || err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ marginTop: 12, border: '1px solid #eee', padding: 12, borderRadius: 8, maxWidth: 900 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>{title}</div>
        <div style={{ color: '#666' }}>{bodyParts}</div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <input placeholder="Body parts (comma-separated)" value={bodyParts} onChange={(e) => setBodyParts(e.target.value)} style={{ padding: '6px 8px', border: '1px solid #ccc', borderRadius: 6, flex: 1 }} />
        <input placeholder="Frequency (e.g. 3x/week)" value={frequency} onChange={(e) => setFrequency(e.target.value)} style={{ padding: '6px 8px', border: '1px solid #ccc', borderRadius: 6, width: 180 }} />
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
        isPending={false}
        defaultSets={3}
        defaultReps={10}
        setDefaultSets={() => {}}
        setDefaultReps={() => {}}
        updateSets={(id: number, v: number) => updateExercise(id, 'sets', v)}
        updateReps={(id: number, v: number) => updateExercise(id, 'reps', v)}
        removeExercise={(id: number) => removeExercise(id)}
        frequency={frequency}
        setFrequency={setFrequency}
      />

      <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={save} disabled={saving} style={{ padding: '8px 12px', background: '#007da4', color: 'white', border: 'none', borderRadius: 8 }}>{saving ? 'Saving...' : 'Save'}</button>
        {message && <div style={{ color: message === 'Saved' ? 'green' : 'red' }}>{message}</div>}
      </div>
    </div>
  );
}
