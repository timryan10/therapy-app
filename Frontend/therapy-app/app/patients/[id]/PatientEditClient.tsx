"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  contact?: string;
  birthdate?: string;
  lastVisit?: string;
  notes?: string;
};

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function PatientEditClient({ patient }: { patient: Patient }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(patient.firstName || "");
  const [lastName, setLastName] = useState(patient.lastName || "");
  const [contact, setContact] = useState(patient.contact || "");
  const [birthdate, setBirthdate] = useState(patient.birthdate || "");
  const [notes, setNotes] = useState(patient.notes || "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    setSaving(true);
    try {
      const payload = { firstName, lastName, contact, birthdate, notes };
      const res = await fetch(`${BACKEND}/patients/${patient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Failed to save (${res.status})`);
      // navigate back to patient view
      router.push(`/patients/${patient.id}`);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            First name
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} style={{ padding: '6px 8px', border: '1px solid #ccc', borderRadius: 6 }} />
          </label>
          <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            Last name
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} style={{ padding: '6px 8px', border: '1px solid #ccc', borderRadius: 6 }} />
          </label>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            Contact
            <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Email or phone" style={{ padding: '6px 8px', border: '1px solid #ccc', borderRadius: 6 }} />
          </label>
          <label style={{ width: 200, display: 'flex', flexDirection: 'column', gap: 6 }}>
            Birthdate
            <input type="date" value={birthdate || ''} onChange={(e) => setBirthdate(e.target.value)} style={{ padding: '6px 8px', border: '1px solid #ccc', borderRadius: 6 }} />
          </label>
        </div>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
        Notes
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={{ width: '100%', minHeight: 80, padding: '8px', border: '1px solid #ccc', borderRadius: 6 }} />
      </label>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button onClick={save} disabled={saving} style={{ padding: '8px 12px', background: '#007da4', color: 'white', border: 'none', borderRadius: 8 }}>{saving ? 'Saving...' : 'Save Changes'}</button>
        <button onClick={() => router.push(`/patients/${patient.id}`)} style={{ padding: '8px 12px', background: '#eee', color: '#222', border: 'none', borderRadius: 8 }}>Cancel</button>
      </div>
      {error && <div style={{ color: 'crimson', marginTop: 8 }}>{error}</div>}
    </div>
  );
}
