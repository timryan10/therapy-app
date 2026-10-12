"use client";

import React from "react";

type Exercise = {
  id: number;
  name: string;
  category?: string;
  description?: string;
  sets?: number;
  reps?: number;
};

export default function ExercisePicker(props: {
  libMode?: 'library' | 'my';
  setLibMode?: (m: 'library' | 'my') => void;
  caseTitle?: string;
  setCaseTitle?: (s: string) => void;
  caseBodyParts?: string;
  setCaseBodyParts?: (s: string) => void;
  query: string;
  setQuery: (s: string) => void;
  libraryResults: Exercise[];
  searchLoading?: boolean;
  addExercise: (e?: any, nameArg?: string) => void;
  addExerciseFromLibrary: (item: Exercise) => void;
  displayedExercises: Exercise[];
  isPending?: boolean;
  defaultSets?: number;
  defaultReps?: number;
  setDefaultSets?: (n: number) => void;
  setDefaultReps?: (n: number) => void;
  updateSets: (exId: number, v: number) => void;
  updateReps: (exId: number, v: number) => void;
  removeExercise: (id: number) => void;
  removePendingExercise?: (id: number) => void;
  frequency?: string;
  setFrequency?: (s: string) => void;
}) {
  const {
    libMode,
    setLibMode,
    caseTitle,
    setCaseTitle,
    caseBodyParts,
    setCaseBodyParts,
    query,
    setQuery,
    libraryResults,
    searchLoading,
    addExercise,
    addExerciseFromLibrary,
    displayedExercises,
    isPending,
    defaultSets,
    defaultReps,
    setDefaultSets,
    setDefaultReps,
    updateSets,
    updateReps,
    removeExercise,
    removePendingExercise,
    frequency,
    setFrequency,
  } = props;

  return (
    <>
      {setCaseTitle && setCaseBodyParts && (
        <section style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <h3>HEP Title/ Case: </h3>
            <input placeholder="Case title(Optional)" value={caseTitle || ''} onChange={(e) => setCaseTitle && setCaseTitle(e.target.value)} style={{ padding: '6px 8px', border: '1px solid #ccc', borderRadius: 6 }} />
            <input placeholder="Body parts" value={caseBodyParts || ''} onChange={(e) => setCaseBodyParts && setCaseBodyParts(e.target.value)} style={{ padding: '6px 8px', border: '1px solid #ccc', borderRadius: 6 }} />
          </div>
        </section>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
        {setLibMode && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ display: 'inline-flex', border: '1px solid #e6e6e6', borderRadius: 8, overflow: 'hidden' }} role="tablist" aria-label="Library toggle">
              <button type="button" aria-pressed={libMode === 'library'} onClick={() => setLibMode && setLibMode('library')} style={{ padding: '6px 10px', border: 'none', background: libMode === 'library' ? '#007da4' : 'white', color: libMode === 'library' ? 'white' : '#007da4', cursor: 'pointer' }}>Library</button>
              <button type="button" aria-pressed={libMode === 'my'} onClick={() => setLibMode && setLibMode('my')} style={{ padding: '6px 10px', border: 'none', background: libMode === 'my' ? '#007da4' : 'white', color: libMode === 'my' ? 'white' : '#007da4', cursor: 'pointer' }}>My Library</button>
            </div>
            <div style={{ color: '#666', fontSize: 13 }}>{libMode === 'library' ? 'Searching global library' : 'Searching My Library'}</div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <input aria-label={libMode === 'my' ? 'Search my library' : 'Search exercises'} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addExercise(); } }} placeholder={libMode === 'my' ? 'Search My Library' : 'Search exercises'} style={{ padding: '6px 8px', border: '1px solid #ccc', borderRadius: 6, width: '100%' }} />
          </div>
          {setFrequency && <input placeholder="Frequency (e.g. 3x/week)" value={frequency || ''} onChange={(e) => setFrequency(e.target.value)} style={{ padding: '6px 8px', border: '1px solid #ccc', borderRadius: 6, width: 220 }} />}
        </div>
      </div>

      {libraryResults && libraryResults.length > 0 && (
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

      {displayedExercises && (
        <>
          <div className="exercise-list" style={{ border: '1px solid #ddd', padding: 8, borderRadius: 8, maxHeight: 320, overflow: 'auto', width: '100%', maxWidth: 900 }}>
            {displayedExercises.length === 0 ? (
              <div style={{ color: '#666' }}>No exercises added.</div>
            ) : (
              displayedExercises.map((ex) => {
                const currentSets = (ex as any).sets ?? defaultSets ?? 3;
                const currentReps = (ex as any).reps ?? defaultReps ?? 10;

                return (
                  <div key={ex.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{ex.name}</div>
                      {ex.description && <div style={{ fontSize: 12, color: '#666' }}>{ex.description}</div>}
                      <div style={{ display: 'flex', gap: 12, marginTop: 6, alignItems: 'center' }}>
                        <div style={{ color: '#666', fontSize: 13 }}>{isPending ? 'Will be added to new case' : ''}</div>
                        <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>Sets<input type="number" min={1} value={currentSets} onChange={(e) => props.updateSets(ex.id, Number(e.target.value || 1))} style={{ width: 80, padding: '6px 8px', border: '1px solid #ccc', borderRadius: 6 }} /></label>
                        <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>Reps<input type="number" min={1} value={currentReps} onChange={(e) => props.updateReps(ex.id, Number(e.target.value || 1))} style={{ width: 80, padding: '6px 8px', border: '1px solid #ccc', borderRadius: 6 }} /></label>
                      </div>
                    </div>
                    <button onClick={() => { if (isPending && removePendingExercise) removePendingExercise(ex.id); else removeExercise(ex.id); }} aria-label={`Remove ${ex.name}`} style={{ color: '#c00', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </>
  );
}
