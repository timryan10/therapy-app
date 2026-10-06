import Header from "../../../components/TherapistHeader";
import PatientClient from "../PatientClient";
import PatientFallbackClient from "../../PatientFallbackClient";
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

export default async function EditPatientPage({ params }: { params: any }) {
  // unwrap possibly-promise params
  // eslint-disable-next-line no-param-reassign
  params = await params;
  const { id } = params as { id?: string };
  if (!id) notFound();

  try {
    const pRes = await fetch(`${BACKEND}/patients/${id}`, { cache: 'no-store' });
    if (!pRes.ok) {
      if (pRes.status === 404) notFound();
      return (
        <div className="main">
          <Header />
          <div className="content">
            <PatientFallbackClient id={id} />
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
            <h2>Edit Patient</h2>
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
          <PatientFallbackClient id={id} />
        </div>
      </div>
    );
  }
}
