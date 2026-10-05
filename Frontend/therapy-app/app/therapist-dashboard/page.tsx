"use client";

import Link from "next/link";
import Header from "../components/TherapistHeader";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  contact?: string;
  lastVisit?: string;
  notes?: string;
};

export default function Page() {
  const [patients, setPatients] = useState<Patient[] | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    fetch(`${BACKEND}/patients`)
      .then((r) => r.json())
        .then((data) => {
        // sort by lastVisit (most recent first). fall back to 0 for missing dates
        const sorted = (data || []).slice().sort((a: any, b: any) => {
          const ta = a?.lastVisit ? new Date(a.lastVisit).getTime() : 0;
          const tb = b?.lastVisit ? new Date(b.lastVisit).getTime() : 0;
          return tb - ta;
        });
        // limit to the most recent 10 patients to save memory
        setPatients(sorted.slice(0, 10));
      })
      .catch((e) => {
        console.error('Failed to fetch patients', e);
        setPatients([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="main">
      <Header />
      <div className="content">
        <div className="actions">
          <Link href="/create-patient">
            <button className="action-button new-hep">
              <h2>Create Patient</h2>
            </button>
          </Link>

          <Link href="/patients">
            <button className="action-button existing-patients">
              <h2>Existing Patients</h2>
            </button>
          </Link>
        </div>

        <div className="recent-hep">
          <h2>Recent Patients</h2>
          {loading && <div>Loading patients...</div>}
          {!loading && patients && patients.length === 0 && (
            <div>No recent patients found.</div>
          )}
          {!loading && patients && patients.length > 0 && (
            <ul className="patient-list">
              {patients.map((p) => (
                <li key={p.id} className="patient-item" onClick={() => router.push(`/patients/${encodeURIComponent(p.id)}`)}>
                  <div className="patient-meta">
                    <strong>{p.firstName} {p.lastName}</strong>
                    <div className="patient-contact">{p.contact}</div>
                  </div>
                  <div className="patient-right">
                    <div className="last-visit">Last: {p.lastVisit}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
