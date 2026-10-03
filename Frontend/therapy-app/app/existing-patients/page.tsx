import Header from "../components/TherapistHeader";
import Link from "next/link";

export default function ExistingPatients() {
  return (
    <div className="main">
      <Header />
      <div className="content">
        <h2>Existing Patients</h2>
        <p>This page will list all patients (25 per page). Use the search bar to find someone specific.</p>
        <div style={{ marginTop: 12 }}>
          <Link href="/patients">
            <button style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#007da4', color: 'white' }}>Open Patients List</button>
          </Link>
        </div>
      </div>
    </div>
  );
}