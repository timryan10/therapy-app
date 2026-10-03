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
  const [firstNameState, setFirstNameState] = useState<string>(patient.firstName || "");
  const [lastNameState, setLastNameState] = useState<string>(patient.lastName || "");
  const [contactState, setContactState] = useState<string>(patient.contact || "");
  const [birthdateState, setBirthdateState] = useState<string>(patient.birthdate || "");
  const [savingInfo, setSavingInfo] = useState(false);

  async function savePatientInfo() {
    setSavingInfo(true);
    try {
      const payload: any = { firstName: firstNameState, lastName: lastNameState, contact: contactState, birthdate: birthdateState };
      await fetch(`${BACKEND}/patients/${patient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      router.refresh();
    } catch (err) {
      console.error('Failed to save patient info', err);
    } finally {
      setSavingInfo(false);
    }
  }

  return (
    <div>
      <button onClick={() => router.back()} style={{ marginBottom: 12 }}>← Back</button>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <input value={firstNameState} onChange={(e) => setFirstNameState(e.target.value)} placeholder="First name" />
            <input value={lastNameState} onChange={(e) => setLastNameState(e.target.value)} placeholder="Last name" />
          </div>
          <div style={{ marginTop: 8 }}>
            <input value={contactState} onChange={(e) => setContactState(e.target.value)} placeholder="Email or phone" />
            <input style={{ marginLeft: 8 }} type="date" value={birthdateState || ''} onChange={(e) => setBirthdateState(e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => router.push('/therapist-dashboard')} style={{ background: '#eee', color: '#222', border: 'none', padding: '8px 12px', borderRadius: 8 }}>Back to Dashboard</button>
          <button onClick={savePatientInfo} disabled={savingInfo} style={{ background: '#007da4', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8 }}>{savingInfo ? 'Saving...' : 'Save Patient'}</button>
        </div>
      </div>

      <div style={{ fontSize: 13, marginBottom: 12 }}>Last visit: {patient.lastVisit}</div>
      <div style={{ marginBottom: 12 }}>{patient.notes}</div>

      <div style={{ marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>Cases</h3>
        {(!patient.cases || patient.cases.length === 0) ? (
          <div style={{ color: '#666', marginTop: 8 }}>No cases assigned for this patient.</div>
        ) : (
          <div style={{ marginTop: 8, border: '1px solid #eee', padding: 8, borderRadius: 8 }}>
            {patient.cases.map((c) => (
              <div key={String(c.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #fafafa' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{c.title}</div>
                  <div style={{ color: '#666', fontSize: 13 }}>{c.bodyParts.join(', ')}</div>
                </div>
                <div>
                  <button onClick={() => router.push(`/patients/${patient.id}/cases/${c.id}`)} style={{ background: '#007da4', color: 'white', border: 'none', padding: '6px 10px', borderRadius: 6 }}>View Exercises</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
