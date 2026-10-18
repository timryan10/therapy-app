import PatientHeader from "../../components/PatientHeader";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default async function Page({ params }: { params: any }) {
  const { id } = await params;
  try {
    const res = await fetch(`${BACKEND}/patients/${encodeURIComponent(id)}`);
    if (!res.ok) return (
      <div>
        <PatientHeader />
        <div style={{ padding: 20 }}>Patient not found</div>
      </div>
    );
    const patient = await res.json();

    const hep = patient.hep || [];
    // collect HEP from cases
    const caseHep = (patient.cases || []).flatMap((c: any) => c.hep || []);

    return (
      <div className="main">
        <PatientHeader />
        <div className="content" style={{ padding: 20 }}>
          <h2>{patient.firstName} {patient.lastName}'s Programs</h2>

          <section style={{ marginTop: 18 }}>
            <h3>Home Exercise Program</h3>
            {hep.length === 0 ? (
              <div style={{ color: '#666' }}>No HEP assigned.</div>
            ) : (
              <ul>
                {hep.map((ex: any) => (
                  <li key={String(ex.id)} style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 600 }}>{ex.name}</div>
                    {ex.description && <div style={{ color: '#666' }}>{ex.description}</div>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section style={{ marginTop: 18 }}>
            <h3>Programs by Case</h3>
            {(patient.cases || []).length === 0 ? (
              <div style={{ color: '#666' }}>No cases.</div>
            ) : (
              (patient.cases || []).map((c: any) => (
                <div key={String(c.id)} style={{ border: '1px solid #eee', padding: 12, borderRadius: 8, marginBottom: 12 }}>
                  <div style={{ fontWeight: 700 }}>{c.title}</div>
                  {c.notes && <div style={{ color: '#666', marginBottom: 8 }}>{c.notes}</div>}
                  {(c.hep || []).length === 0 ? (
                    <div style={{ color: '#666' }}>No HEP for this case.</div>
                  ) : (
                    <ul>
                      {c.hep.map((ex: any) => (
                        <li key={String(ex.id)} style={{ marginBottom: 6 }}>
                          <div style={{ fontWeight: 600 }}>{ex.name}</div>
                          {ex.description && <div style={{ color: '#666' }}>{ex.description}</div>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))
            )}
          </section>
        </div>
      </div>
    );
  } catch (err) {
    return (
      <div>
        <PatientHeader />
        <div style={{ padding: 20 }}>Failed to load patient</div>
      </div>
    );
  }
}
