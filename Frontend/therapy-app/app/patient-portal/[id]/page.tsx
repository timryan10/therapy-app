import PatientHeader from "../../components/PatientHeader";
import Link from "next/link";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

function getGreeting(firstName: string) {
  const hour = new Date().getHours();
  if (hour < 12) return `Good morning ${firstName}`;
  if (hour < 18) return `Good afternoon ${firstName}`;
  return `Good evening ${firstName}`;
}

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

function getPrescribedTimesPerDay(c: any) {
  const raw = (c?.frequency || '').toString().trim().toLowerCase();
  if (!raw) return null;
  if (raw.includes('week') || raw.includes('wk') || raw.includes('month')) return null;

  const match = raw.match(/(\d+)/);
  if (!match) return null;

  const count = Number(match[1]);
  if (!Number.isFinite(count) || count <= 0) return null;
  return count;
}

function getLast7Days() {
  const days: { key: string; label: string; dayNumber: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push({
      key: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
    });
  }
  return days;
}

function getCompletionsForDate(c: any, dateKey: string) {
  if (Array.isArray(c?.completionHistory)) {
    return c.completionHistory.filter((entry: any) => {
      const date = (entry?.date || '').toString().slice(0, 10);
      return date === dateKey;
    }).length;
  }

  const today = new Date().toISOString().slice(0, 10);
  if (dateKey !== today) return 0;

  const direct = Number(c?.completedToday ?? c?.timesCompletedToday ?? c?.dailyCompletedCount ?? 0);
  return Number.isFinite(direct) && direct > 0 ? direct : 0;
}

export default async function Page({ params }: { params: any }) {
  const { id } = await params;
  const weekDays = getLast7Days();
  try {
    const res = await fetch(`${BACKEND}/patients/${encodeURIComponent(id)}`);
    if (!res.ok) return (
      <div>
        <PatientHeader />
        <div style={{ padding: 20 }}>Patient not found</div>
      </div>
    );
    const patient = await res.json();

    return (
      <div className="main">
        <PatientHeader />
        <div className="content" style={{ padding: 20 }}>
          <h1>{getGreeting(patient.firstName || 'there')}</h1>

          <section style={{ marginTop: 18, width: '100%' }}>
            <h3 style={{ marginTop: 12 }}>Home Exercise Programs:</h3>
            {(patient.cases || []).length === 0 ? (
              <div style={{ color: '#666' }}>No Home Exercise Programs.</div>
            ) : (
              <div style={{ marginTop: 8, display: 'grid', gap: 10, width: '100%' }}>
                {(patient.cases || []).map((c: any) => {
                  const exerciseCount = Array.isArray(c.hep) ? c.hep.length : 0;
                  const completedToday = getCompletedTodayCount(c);
                  const prescribedTimesPerDay = getPrescribedTimesPerDay(c);
                  return (
                    <div key={String(c.id)} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, width: '100%', boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{c.title || 'Untitled Case'}</div>
                        <div style={{ marginTop: 6, color: '#334155' }}>Exercises: {exerciseCount}</div>
                        <div style={{ color: '#334155' }}>
                          {prescribedTimesPerDay
                            ? `${completedToday} out of ${prescribedTimesPerDay} times a day`
                            : `Completed today: ${completedToday}`}
                        </div>
                        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {weekDays.map((day) => {
                            const count = getCompletionsForDate(c, day.key);
                            const isComplete = prescribedTimesPerDay ? count >= prescribedTimesPerDay : count > 0;
                            const isInProgress = prescribedTimesPerDay ? count > 0 && count < prescribedTimesPerDay : false;
                            const symbol = isComplete ? '✓' : isInProgress ? '!' : '✕';
                            const bg = isComplete ? '#dcfce7' : isInProgress ? '#fef3c7' : '#fee2e2';
                            const fg = isComplete ? '#166534' : isInProgress ? '#92400e' : '#991b1b';

                            return (
                              <div
                                key={day.key}
                                title={`${day.label}: ${count}${prescribedTimesPerDay ? ` / ${prescribedTimesPerDay}` : ''}`}
                                style={{
                                  minWidth: 52,
                                  border: '1px solid #e2e8f0',
                                  borderRadius: 6,
                                  padding: '4px 6px',
                                  textAlign: 'center',
                                  background: bg,
                                  color: fg,
                                  fontSize: 12,
                                  fontWeight: 700,
                                }}
                              >
                                <div style={{ fontSize: 11 }}>{day.label} {day.dayNumber}</div>
                                <div>{symbol}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <Link href={`/patient-portal/${encodeURIComponent(id)}/cases/${encodeURIComponent(String(c.id))}`}>
                        <button style={{ background: '#007da4', color: 'white', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          Start Program
                        </button>
                      </Link>
                    </div>
                  );
                })}
              </div>
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
