import Header from "../../../../components/TherapistHeader";
import { notFound } from "next/navigation";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

type Exercise = {
  id: number;
  name: string;
  category?: string;
  description?: string;
};

export default async function CaseExercisesPage({ params }: { params: any }) {
  // unwrap possibly-promise params
  // eslint-disable-next-line no-param-reassign
  params = await params;
  const { id, caseId } = params as { id?: string; caseId?: string };
  if (!id || !caseId) notFound();

  try {
    const pRes = await fetch(`${BACKEND}/patients/${id}`, { cache: 'no-store' });
    if (!pRes.ok) {
      if (pRes.status === 404) notFound();
      return (
        <div className="main">
          <Header />
          <div className="content">Unable to load patient.</div>
        </div>
      );
    }

    const patient = await pRes.json();
    const exRes = await fetch(`${BACKEND}/exercises`, { cache: 'no-store' });
    const exercises: Exercise[] = exRes.ok ? await exRes.json() : [];

    const theCase = (patient.cases || []).find((c: any) => String(c.id) === String(caseId));
    if (!theCase) {
      return (
        <div className="main">
          <Header />
          <div className="content">
            <div style={{ width: '100%', maxWidth: 900 }}>
              <h2>Case not found</h2>
            </div>
          </div>
        </div>
      );
    }

    // Prefer exercises attached directly to the case (theCase.hep). If none, fall back
    // to library suggestions filtered by bodyParts matching exercise.category.
    const caseHep: Exercise[] = (theCase.hep || []).map((h: any) => ({ id: h.id, name: h.name, category: h.category, description: h.description }));
    const filtered = caseHep.length > 0 ? caseHep : exercises.filter((e) => theCase.bodyParts.includes(e.category || ''));

    return (
      <div className="main">
        <Header />
        <div className="content">
          <div style={{ width: '100%', maxWidth: 900 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
              <h2 style={{ margin: 0 }}>{theCase.title}</h2>
              {theCase.bodyParts && theCase.bodyParts.length > 0 && (
                <div style={{ color: '#666' }}>{theCase.bodyParts.join(', ')}</div>
              )}
            </div>
            {filtered.length === 0 ? (
              <div style={{ color: '#666' }}>No exercises found for this case.</div>
            ) : (
              <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
                {filtered.map((ex) => (
                  <div key={ex.id} style={{ padding: '8px 0', borderBottom: '1px solid #f7f7f7' }}>
                    <div style={{ fontWeight: 600 }}>{ex.name}</div>
                    {ex.description && <div style={{ color: '#666' }}>{ex.description}</div>}
                    {ex.category && <div style={{ color: '#999', fontSize: 13 }}>{ex.category}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (err) {
    return (
      <div className="main">
        <Header />
        <div className="content">
          <div style={{ width: '100%', maxWidth: 900 }}>Error loading case exercises.</div>
        </div>
      </div>
    );
  }
}
