"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../components/TherapistHeader";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
const THERAPIST_ID = process.env.NEXT_PUBLIC_THERAPIST_ID || "therapist1";

type PresetProgram = {
  id: string;
  title: string;
  bodyParts?: string[];
  frequency?: string;
  hep?: any[];
  createdAt?: string;
};

export default function PresetProgramsPage() {
  const [items, setItems] = useState<PresetProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [removing, setRemoving] = useState<Record<string, boolean>>({});

  function load() {
    setLoading(true);
    setError(null);
    fetch(`${BACKEND}/therapists/${encodeURIComponent(THERAPIST_ID)}/preset-programs`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((e) => setError(String(e?.message || e || "Failed to load preset programs")))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function removePreset(id: string) {
    setRemoving((s) => ({ ...s, [id]: true }));
    setError(null);
    try {
      const res = await fetch(`${BACKEND}/therapists/${encodeURIComponent(THERAPIST_ID)}/preset-programs/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to remove preset");
      setItems((prev) => prev.filter((p) => String(p.id) !== String(id)));
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setRemoving((s) => ({ ...s, [id]: false }));
    }
  }

  const q = (search || "").trim().toLowerCase();
  const filtered = q
    ? items.filter((p) => (p.title || "").toLowerCase().includes(q) || (p.frequency || "").toLowerCase().includes(q))
    : items;

  return (
    <div className="main">
      <Header />
      <div className="content" style={{ width: "100%", maxWidth: 900, alignItems: "stretch" }}>
        <h2>Preset Programs</h2>
        <div style={{ color: "#666", marginBottom: 12 }}>Search presets or create a new one.</div>

        {error && <div style={{ color: "crimson", marginBottom: 10 }}>{error}</div>}

        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, width: "100%" }}>
          <input
            aria-label="Search preset programs"
            placeholder="Search preset programs by title or frequency"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: "8px 10px", flex: 1, borderRadius: 6, border: "1px solid #ccc" }}
          />
          <Link href="/preset-programs/new" style={{ padding: "8px 12px", borderRadius: 6, background: "#007da4", color: "#fff", textDecoration: "none", whiteSpace: "nowrap" }}>
            Create Program
          </Link>
        </div>

        <section>
          <h3 style={{ marginTop: 0 }}>Saved Presets</h3>
          {loading && <div>Loading preset programs...</div>}
          {!loading && filtered.length === 0 && <div style={{ color: "#666" }}>No preset programs found.</div>}
          {!loading && filtered.length > 0 && (
            <div className="exercise-list" style={{ width: "100%", border: "1px solid #eee", padding: 12, borderRadius: 8 }}>
              {filtered.map((p) => (
                <div key={p.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, background: "#fff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{p.title}</div>
                      <div style={{ color: "#475569", fontSize: 13 }}>
                        {(p.hep || []).length} exercises {p.frequency ? `• ${p.frequency}` : ""}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePreset(p.id)}
                      disabled={!!removing[p.id]}
                      style={{ border: "1px solid #e5e7eb", background: "#fff", borderRadius: 8, padding: "6px 10px", cursor: "pointer" }}
                    >
                      {removing[p.id] ? "Removing..." : "Remove"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
