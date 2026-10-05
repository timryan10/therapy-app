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

  useEffect(() => {
    // do not preload anything on mount
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
        <h2>Patients</h2>
        <p>Search for a patient by name, contact or notes. No patient list is preloaded.</p>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
          <input
            aria-label="Search patients"
            value={query}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Search patients by name, contact or notes"
            style={{ padding: '8px 10px', flex: 1, borderRadius: 6, border: '1px solid #ccc' }}
          />
          <button
            onClick={() => doSearch(query)}
            style={{ padding: '8px 12px', borderRadius: 6, background: '#007da4', color: '#fff', border: 'none' }}
          >
            Search
          </button>
          <button
            onClick={() => { setQuery(''); setResults(null); setError(null); }}
            style={{ padding: '8px 12px', borderRadius: 6, background: '#eee', color: '#222', border: 'none' }}
          >
            Clear
          </button>
        </div>

        <div style={{ marginTop: 16 }}>
          {loading && <div>Searching…</div>}
          {error && <div style={{ color: 'crimson' }}>Error: {error}</div>}

          {results && results.length === 0 && !loading && (
            <div style={{ marginTop: 12 }}>No patients found for "{query}"</div>
          )}

          {results && results.length > 0 && (
            <ul style={{ marginTop: 12, paddingLeft: 0, listStyle: 'none' }}>
              {results.map((p) => (
                <li key={p.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <Link href={`/patients/${encodeURIComponent(p.id)}`} style={{ color: '#007da4', textDecoration: 'none' }}>
                        {p.firstName} {p.lastName}
                      </Link>
                  <div style={{ color: '#666', fontSize: 12 }}>{p.contact}</div>
                </li>
              ))}
            </ul>
          )}

          {!results && !loading && (
            <div style={{ marginTop: 12, color: '#666' }}>Type a few letters and press Search.</div>
          )}
        </div>
      </div>
    </div>
  );
}
