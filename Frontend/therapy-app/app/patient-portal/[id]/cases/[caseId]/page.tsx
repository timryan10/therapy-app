import PatientHeader from "../../../../components/PatientHeader";
import Link from "next/link";
import PatientCaseExerciseListClient from "./PatientCaseExerciseListClient";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

function getCompletedTodayCount(c: any) {
  if (Array.isArray(c?.completionHistory)) {
    const today = new Date().toISOString().slice(0, 10);
    return c.completionHistory.filter((entry: any) => {
      const date = (entry?.date || '').toString().slice(0, 10);
      return date === today;
    }).length;
  }

  const direct = Number(c?.completedToday ?? c?.timesCompletedToday ?? c?.dailyCompletedCount ?? 0);
  if (Number.isFinite(direct) && direct > 0) return direct;
  return 0;
}

export default async function PatientCasePage({ params }: { params: any }) {
  const { id, caseId } = await params;

  try {
    const res = await fetch(`${BACKEND}/patients/${encodeURIComponent(id)}`, { cache: 'no-store' });
    if (!res.ok) {
      return (
        <div className="main">
          <PatientHeader />
          <div className="content" style={{ padding: 20 }}>
            <div>Unable to load patient.</div>
          </div>
        </div>
      );
    }

    const patient = await res.json();
    const theCase = (patient.cases || []).find((c: any) => String(c.id) === String(caseId));

    if (!theCase) {
      return (
        <div className="main">
          <PatientHeader />
          <div className="content" style={{ padding: 20 }}>
            <div style={{ marginBottom: 12 }}>Program not found.</div>
            <Link href={`/patient-portal/${encodeURIComponent(id)}`}>Back to Programs</Link>
          </div>
        </div>
      );
    }

    const exercises = Array.isArray(theCase.hep) ? theCase.hep : [];
    const completionHistory = Array.isArray(theCase.completionHistory) ? theCase.completionHistory : [];
    const initialCompletedToday = getCompletedTodayCount(theCase);

    return (
      <div className="main">
        <PatientHeader />
        <div className="content" style={{ padding: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <Link href={`/patient-portal/${encodeURIComponent(id)}`}>← Back to Programs</Link>
          </div>

          <h2 style={{ marginBottom: 6 }}>{theCase.title || 'Program'}</h2>
          <div style={{ color: '#475569', marginBottom: 16 }}>
            {patient.firstName} {patient.lastName}
          </div>

          {exercises.length === 0 ? (
            <div style={{ color: '#666' }}>No exercises in this program yet.</div>
          ) : (
            <PatientCaseExerciseListClient
              patientId={String(id)}
              caseId={String(caseId)}
              exercises={exercises}
              initialCompletedToday={initialCompletedToday}
              initialCompletionHistory={completionHistory}
            />
          )}
        </div>
      </div>
    );
  } catch (err) {
    return (
      <div className="main">
        <PatientHeader />
        <div className="content" style={{ padding: 20 }}>
          <div>Failed to load program.</div>
        </div>
      </div>
    );
  }
}
