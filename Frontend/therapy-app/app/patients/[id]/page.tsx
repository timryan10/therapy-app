import Header from "../../components/TherapistHeader";
import Link from "next/link";
import PatientClient from "./PatientClient";
import PatientFallbackClient from "../PatientFallbackClient";
import { notFound } from "next/navigation";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

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

export default async function PatientPage({ params }: { params: any }) {
  // params may be a Promise in dev; unwrap it
  // eslint-disable-next-line no-param-reassign
  params = await params;

  const { id } = params as { id?: string };
  if (!id) {
    notFound();
  }

  // Attempt server-side fetch. If backend explicitly returns 404, call notFound().
  // For transient failures (network errors or non-404 responses) render a
  // client-side fallback that will retry from the browser.
  try {
    const pRes = await fetch(`${BACKEND}/patients/${id}`, { cache: 'no-store' });
    if (!pRes.ok) {
      if (pRes.status === 404) notFound();
      return (
        <div className="main">
          <Header />
          <div className="content">
            <div style={{ width: '100%', maxWidth: 900 }}>
              <PatientFallbackClient id={id} />
            </div>
          </div>
        </div>
      );
    }

    const patient: Patient = await pRes.json();
    const exRes = await fetch(`${BACKEND}/exercises`, { cache: 'no-store' });
    const exercises: Exercise[] = exRes.ok ? await exRes.json() : [];

    return (
      <div className="main">
        <Header />
        <div className="content">
          <div style={{ width: '100%', maxWidth: 900 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            </div>
            <PatientClient patient={patient} exercises={exercises} />
          </div>
        </div>
      </div>
    );
  } catch (err) {
    return (
      <div className="main">
        <Header />
        <div className="content">
          <div style={{ width: '100%', maxWidth: 900 }}>
            <PatientFallbackClient id={id} />
          </div>
        </div>
      </div>
    );
  };
}
