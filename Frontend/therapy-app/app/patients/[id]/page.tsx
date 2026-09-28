"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "../../components/TherapistHeader";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  contact?: string;
  birthdate?: string;
  lastVisit?: string;
  notes?: string;
};

type Exercise = {
  id: number;
  name: string;
  category?: string;
  description?: string;
};

export default function PatientPage() {
  const { id } = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [hepList, setHepList] = useState<Exercise[]>([]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${BACKEND}/patients/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error('not found');
        return r.json();
      })
      .then((data) => {
        setPatient(data);
        setHepList((data && data.hep) || []);
      })
      .catch(() => setPatient(null))
      .finally(() => setLoading(false));

    fetch(`${BACKEND}/exercises`)
      .then((r) => r.json())
      .then((data) => setExercises(data))
      .catch(() => setExercises([]));
  }, [id]);

  function addToHEP(item: Exercise) {
    setHepList((prev) => (prev.some((p) => p.name === item.name) ? prev : [item, ...prev]));
  }

  function removeFromHEP(name: string) {
    setHepList((prev) => prev.filter((p) => p.name !== name));
  }

  function goToUpdateHEP() {
    if (!patient) return;
    const params = new URLSearchParams({
      firstName: patient.firstName,
      lastName: patient.lastName,
      contact: patient.contact || "",
      birthdate: patient.birthdate || "",
      patientId: patient.id,
    });
    router.push(`/new-hep?${params.toString()}`);
  }

  async function saveHep() {
    if (!patient) return;
    try {
      await fetch(`${BACKEND}/patients/${patient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hep: hepList })
      });
      const r = await fetch(`${BACKEND}/patients/${id}`);
      const d = await r.json();
      setPatient(d);
      setHepList(d.hep || []);
    } catch (err) {
      console.error('Failed to save HEP', err);
    }
  }

  return (
    <div className="main">
      <Header />
      <div className="content">
        <div style={{ width: '100%', maxWidth: 900 }}>
          <button onClick={() => router.back()} style={{ marginBottom: 12 }}>← Back</button>
          {loading && <div>Loading patient...</div>}
          {!loading && !patient && <div>Patient not found.</div>}
          {!loading && patient && (
            <div>
              <h2>{patient.firstName} {patient.lastName}</h2>
              <div style={{ color: '#666', marginBottom: 8 }}>{patient.contact}</div>
              {patient.birthdate && <div style={{ color: '#666', marginBottom: 8 }}>DOB: {patient.birthdate}</div>}
              <div style={{ fontSize: 13, marginBottom: 12 }}>Last visit: {patient.lastVisit}</div>
              <div style={{ marginBottom: 12 }}>{patient.notes}</div>

              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <button onClick={() => router.push('/therapist-dashboard')} style={{ background: '#eee', color: '#222', border: 'none', padding: '8px 12px', borderRadius: 8 }}>Back to Dashboard</button>
                <button onClick={goToUpdateHEP} style={{ background: '#007da4', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8 }}>Update HEP</button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ marginTop: 16, marginBottom: 0 }}>Current HEP</h3>
                <button onClick={saveHep} style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: '#2e8b57', color: 'white', cursor: 'pointer' }}>Save HEP</button>
              </div>
              {hepList.length === 0 ? (
                <div style={{ color: '#666' }}>No exercises added yet.</div>
              ) : (
                <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
                  {hepList.map((h) => (
                    <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <div>{h.name}</div>
                      <button onClick={() => removeFromHEP(h.name)} style={{ color: '#c00', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
