"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

type Exercise = {
  id: string | number;
  name: string;
  description?: string;
  mediaUrl?: string;
  mediaType?: string;
  thumbnailUrl?: string;
  sets?: number;
  reps?: number;
};

type CompletionEntry = { date?: string };

function mediaSrcFor(url?: string) {
  if (!url) return "";
  return url.startsWith("/uploads/") ? `${BACKEND}${url}` : url;
}

function isVideo(ex: Exercise) {
  const byType = (ex.mediaType || "").toLowerCase().startsWith("video/");
  const byExt = /\.(mp4|webm|ogg|mov|m4v)$/i.test(ex.mediaUrl || "");
  const hasKnownImageExt = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(ex.mediaUrl || "");
  const unknownNoExt = !!ex.mediaUrl && !byExt && !hasKnownImageExt && !ex.mediaType;
  return byType || byExt || unknownNoExt;
}

function todayCount(history: CompletionEntry[]) {
  const today = new Date().toISOString().slice(0, 10);
  return history.filter((entry) => (entry?.date || "").toString().slice(0, 10) === today).length;
}

export default function PatientCaseExerciseListClient({
  patientId,
  caseId,
  exercises,
  initialCompletedToday,
  initialCompletionHistory,
}: {
  patientId: string;
  caseId: string;
  exercises: Exercise[];
  initialCompletedToday?: number;
  initialCompletionHistory?: CompletionEntry[];
}) {
  const router = useRouter();
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({});
  const [detailsMap, setDetailsMap] = useState<Record<string, boolean>>({});
  const [programCompleted, setProgramCompleted] = useState(false);
  const [savingCompletion, setSavingCompletion] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [completionHistory, setCompletionHistory] = useState<CompletionEntry[]>(initialCompletionHistory || []);
  const [completedTodayCount, setCompletedTodayCount] = useState<number>(
    Number.isFinite(initialCompletedToday) ? Number(initialCompletedToday) : todayCount(initialCompletionHistory || [])
  );

  const completedCount = useMemo(
    () => exercises.filter((ex) => completedMap[String(ex.id)]).length,
    [completedMap, exercises]
  );
  const canCompleteProgram = exercises.length > 0 && completedCount === exercises.length;

  async function completeProgram() {
    if (!canCompleteProgram || savingCompletion) return;
    setSaveError(null);
    setSavingCompletion(true);

    try {
      const nextHistory = [...completionHistory, { date: new Date().toISOString() }];
      const nextTodayCount = todayCount(nextHistory);

      const res = await fetch(`${BACKEND}/patients/${encodeURIComponent(patientId)}/cases/${encodeURIComponent(caseId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completionHistory: nextHistory,
          completedToday: nextTodayCount,
        }),
      });

      if (!res.ok) throw new Error("Failed to update completion count");

      setCompletionHistory(nextHistory);
      setCompletedTodayCount(nextTodayCount);
      setCompletedMap({});
      setProgramCompleted(true);
      router.push(`/patient-portal/${encodeURIComponent(patientId)}`);
    } catch (e: any) {
      setSaveError(String(e?.message || e));
    } finally {
      setSavingCompletion(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 10, width: "100%" }}>
      <div style={{ color: "#475569", fontSize: 14 }}>
        Completed: {completedCount} / {exercises.length}
      </div>
      <div style={{ color: "#475569", fontSize: 14 }}>
        Completed today: {completedTodayCount}
      </div>

      {exercises.map((ex) => {
        const key = String(ex.id);
        const thumb = mediaSrcFor(ex.thumbnailUrl);
        const mediaSrc = mediaSrcFor(ex.mediaUrl);
        const showDetails = !!detailsMap[key];

        return (
          <div
            key={key}
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: 12,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div style={{ display: "flex", gap: 12, flex: 1 }}>
                {ex.mediaUrl ? (
                  isVideo(ex) ? (
                    thumb ? (
                      <img
                        src={thumb}
                        alt={`${ex.name} thumbnail`}
                        loading="lazy"
                        style={{ width: 96, height: 60, borderRadius: 6, objectFit: "cover", background: "#000" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 96,
                          height: 60,
                          borderRadius: 6,
                          background: "#1f1f1f",
                          color: "#fff",
                          fontSize: 11,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        Video
                      </div>
                    )
                  ) : (
                    <img
                      src={mediaSrc}
                      alt={ex.name}
                      loading="lazy"
                      style={{ width: 96, height: 60, borderRadius: 6, objectFit: "cover" }}
                    />
                  )
                ) : (
                  <div
                    style={{
                      width: 96,
                      height: 60,
                      borderRadius: 6,
                      background: "#f1f5f9",
                      color: "#64748b",
                      fontSize: 11,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    No media
                  </div>
                )}

                <div>
                  <div style={{ fontWeight: 700 }}>{ex.name}</div>
                  <div style={{ color: "#334155", marginTop: 6 }}>
                    {ex.sets ? `Sets: ${ex.sets}` : "Sets: -"} • {ex.reps ? `Reps: ${ex.reps}` : "Reps: -"}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                <label style={{ display: "flex", gap: 6, alignItems: "center", color: "#334155" }}>
                  <input
                    type="checkbox"
                    checked={!!completedMap[key]}
                    onChange={(e) => setCompletedMap((prev) => ({ ...prev, [key]: e.target.checked }))}
                  />
                  Done
                </label>
                <button
                  type="button"
                  onClick={() => setDetailsMap((prev) => ({ ...prev, [key]: !prev[key] }))}
                  style={{
                    background: "#007da4",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    padding: "6px 10px",
                    cursor: "pointer",
                  }}
                >
                  {showDetails ? "Hide Details" : "Details"}
                </button>
              </div>
            </div>

            {showDetails && (
              <div style={{ marginTop: 12, borderTop: "1px solid #e2e8f0", paddingTop: 12 }}>
                <div style={{ color: "#334155", marginBottom: 10 }}>
                  {ex.description?.trim() || "No description provided."}
                </div>

                {mediaSrc &&
                  (isVideo(ex) ? (
                    <video
                      src={mediaSrc}
                      controls
                      preload="metadata"
                      playsInline
                      style={{ width: "100%", maxWidth: 560, borderRadius: 8, background: "#000" }}
                    />
                  ) : (
                    <img
                      src={mediaSrc}
                      alt={ex.name}
                      style={{ width: "100%", maxWidth: 560, borderRadius: 8, objectFit: "cover" }}
                    />
                  ))}
              </div>
            )}
          </div>
        );
      })}

      <div style={{ marginTop: 4, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
        <button
          type="button"
          disabled={!canCompleteProgram || savingCompletion}
          onClick={completeProgram}
          style={{
            background: canCompleteProgram && !savingCompletion ? "#16a34a" : "#94a3b8",
            color: "white",
            border: "none",
            borderRadius: 8,
            padding: "10px 14px",
            cursor: canCompleteProgram && !savingCompletion ? "pointer" : "not-allowed",
          }}
        >
          {savingCompletion ? "Saving..." : "Completed Program"}
        </button>
        {!canCompleteProgram && (
          <div style={{ color: "#64748b", fontSize: 13 }}>
            Check off all exercises to complete the program.
          </div>
        )}
        {programCompleted && (
          <div style={{ color: "#166534", fontSize: 13, fontWeight: 600 }}>
            Program marked as completed.
          </div>
        )}
        {saveError && (
          <div style={{ color: "#b91c1c", fontSize: 13, fontWeight: 600 }}>
            {saveError}
          </div>
        )}
      </div>
    </div>
  );
}
