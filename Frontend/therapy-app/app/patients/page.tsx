"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Header from "../components/TherapistHeader";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function PatientsListPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deb = useRef<any>(null);
  const THERAPIST_ID = process.env.NEXT_PUBLIC_THERAPIST_ID || 'therapist-1';
  const [myPatientIds, setMyPatientIds] = useState<string[]>([]);

  useEffect(() => {
    // do not preload anything on mount
    // preload therapist's patients mapping so we can disable Add button
    if (THERAPIST_ID) {
      fetch(`${BACKEND}/therapists/${encodeURIComponent(THERAPIST_ID)}/patients`)
        .then((r) => r.ok ? r.json() : [])
        .then((json) => {
          const ids = Array.isArray(json) ? json.map((p: any) => p.id) : [];
          setMyPatientIds(ids);
        })
        .catch(() => {});
    }

    return () => {
      if (deb.current) window.clearTimeout(deb.current);
    };
  }, []);

  const doSearch = (q: string) => {
    const trimmed = (q || "").trim();
    if (trimmed === "") {
      setResults(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    fetch(`${BACKEND}/patients/search?q=${encodeURIComponent(trimmed)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`search failed ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setResults(Array.isArray(json) ? json : []);
        setLoading(false);
      })
      .catch((e: any) => {
        setError(e?.message || "Network error");
        setLoading(false);
      });
  };

  const onChange = (v: string) => {
    setQuery(v);
    if (deb.current) window.clearTimeout(deb.current);
    // debounce to avoid too many requests while typing
    deb.current = window.setTimeout(() => doSearch(v), 350);
  };

  return (
    <div className="main">
      <Header />
      <div className="content">
        <h1>Patient Search</h1>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, width: '100%' }}>
          <input
            aria-label="Search patients"
            value={query}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Search patients by name or contact"
            style={{ padding: '8px 10px', flex: 1, borderRadius: 6, border: '1px solid #ccc' }}
          />
          <button
            onClick={() => { setQuery(''); setResults(null); setError(null); }}
            style={{ padding: '8px 12px', borderRadius: 6, background: '#eee', color: '#222', border: 'none' }}
          >
            Clear
          </button>
        </div>

        <div style={{ marginTop: 16, width: '100%' }}>
          {loading && <div>Searching…</div>}
          {error && <div style={{ color: 'crimson' }}>Error: {error}</div>}

          {results && results.length === 0 && !loading && (
            <div style={{ marginTop: 12 }}>No patients found for "{query}"</div>
          )}

          {results && results.length > 0 && (
            <ul style={{ marginTop: 12, paddingLeft: 0, listStyle: 'none', width: '100%' }}>
              {results.map((p) => (
                <li
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    borderBottom: '1px solid #f0f0f0',
                    width: '100%',
                    boxSizing: 'border-box',
                    border: '1px solid #eee',
                    borderRadius: 6,
                    marginBottom: 8,
                  }}
                >
                  <Link href={`/patients/${encodeURIComponent(p.id)}`} style={{ color: '#007da4', textDecoration: 'none', flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{p.firstName} {p.lastName}</div>
                    <div style={{ color: '#666', fontSize: 13 }}>{p.contact || 'No contact'}</div>
                  </Link>

                  <div style={{ width: 220, textAlign: 'right', color: '#666', fontSize: 13 }}>
                    <div>Birthday: {p.birthdate || '—'}</div>
                    <div>Cases: {(p.cases || []).length}</div>
                  </div>

                  <div style={{ marginLeft: 12 }}>
                    {myPatientIds.includes(p.id) ? (
                      <button style={{ padding: '6px 10px', borderRadius: 6, background: '#ddd', border: 'none' }} disabled>Added</button>
                    ) : (
                      <button
                        onClick={() => {
                          fetch(`${BACKEND}/therapists/${encodeURIComponent(THERAPIST_ID)}/patients`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ patientId: p.id })
                          })
                            .then((r) => {
                              if (!r.ok) throw new Error('failed');
                              return r.json();
                            })
                            .then((added) => {
                              setMyPatientIds((s) => [p.id, ...s]);
                            })
                            .catch(() => alert('Failed to add patient'));
                        }}
                        style={{ padding: '6px 10px', borderRadius: 6, background: '#007da4', color: '#fff', border: 'none' }}
                      >
                        Add
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* No preloaded list; results appear as therapist types. */}
        </div>
      </div>
    </div>
  );
}
