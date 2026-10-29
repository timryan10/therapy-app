"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "../../components/TherapistHeader";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
const THERAPIST_ID = process.env.NEXT_PUBLIC_THERAPIST_ID || 'therapist-1';

export default function MyPatientsPage() {
  const [patients, setPatients] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`${BACKEND}/therapists/${encodeURIComponent(THERAPIST_ID)}/patients`)
      .then((res) => {
        if (!res.ok) throw new Error(`fetch failed ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setPatients(Array.isArray(json) ? json : []);
        setLoading(false);
      })
      .catch((e: any) => {
        setError(e?.message || 'Network error');
        setLoading(false);
      });
  }, []);

  const sortedPatients = useMemo(() => {
    const list = Array.isArray(patients) ? [...patients] : [];
    return list.sort((a, b) => {
      const aLast = String(a?.lastName || '').toLowerCase();
      const bLast = String(b?.lastName || '').toLowerCase();
      if (aLast !== bLast) return aLast.localeCompare(bLast);

      const aFirst = String(a?.firstName || '').toLowerCase();
      const bFirst = String(b?.firstName || '').toLowerCase();
      return aFirst.localeCompare(bFirst);
    });
  }, [patients]);

  const filteredPatients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sortedPatients;
    return sortedPatients.filter((p) => {
      const fullName = `${p?.firstName || ''} ${p?.lastName || ''}`.toLowerCase();
      const contact = String(p?.contact || '').toLowerCase();
      return fullName.includes(q) || contact.includes(q);
    });
  }, [query, sortedPatients]);

  return (
    <div className="main">
      <Header />
      <div className="content">
        <h2>My Patients</h2>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, width: '100%' }}>
          <input
            aria-label="Search my patients"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by patient name or contact"
            style={{ padding: '8px 10px', flex: 1, borderRadius: 6, border: '1px solid #ccc' }}
          />
          <button
            onClick={() => setQuery('')}
            style={{ padding: '8px 12px', borderRadius: 6, background: '#eee', color: '#222', border: 'none' }}
          >
            Clear
          </button>
        </div>

        {loading && <div>Loading…</div>}
        {error && <div style={{ color: 'crimson' }}>Error: {error}</div>}

        {patients && patients.length === 0 && !loading && (
          <div style={{ marginTop: 12 }}>You have not added any patients yet.</div>
        )}

        {patients && patients.length > 0 && filteredPatients.length === 0 && !loading && (
          <div style={{ marginTop: 12 }}>No patients found for "{query}".</div>
        )}

        {patients && patients.length > 0 && filteredPatients.length > 0 && (
          <ul style={{ marginTop: 12, paddingLeft: 0, listStyle: 'none', width: '100%', border: '1px solid #f0f0f0', borderRadius: 6, overflow: 'hidden' }}>
            {filteredPatients.map((p) => (
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
                }}
              >
                <Link
                  href={`/patients/${encodeURIComponent(p.id)}`}
                  style={{ color: '#007da4', textDecoration: 'none', flex: 1 }}
                >
                  <div style={{ fontWeight: 600 }}>{p.firstName} {p.lastName}</div>
                  <div style={{ color: '#666', fontSize: 13 }}>{p.contact || 'No contact'}</div>
                </Link>

                <div style={{ width: 220, textAlign: 'right', color: '#666', fontSize: 13 }}>
                  <div>Birthday: {p.birthdate || '—'}</div>
                  <div>Cases: {(p.cases || []).length}</div>
                </div>

                <div style={{ marginLeft: 12 }}>
                  <button
                    onClick={async () => {
                      if (!confirm(`Remove ${p.firstName} ${p.lastName} from your patients?`)) return;
                      try {
                        const res = await fetch(`${BACKEND}/therapists/${encodeURIComponent(THERAPIST_ID)}/patients/${encodeURIComponent(p.id)}`, {
                          method: 'DELETE',
                        });
                        if (!res.ok) throw new Error(`remove failed ${res.status}`);
                        setPatients((prev) => (prev ? prev.filter((x) => x.id !== p.id) : prev));
                      } catch (e: any) {
                        alert('Failed to remove patient: ' + (e?.message || 'Network error'));
                      }
                    }}
                    style={{
                      background: '#fff',
                      border: '1px solid #e0e0e0',
                      padding: '6px 8px',
                      borderRadius: 6,
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
