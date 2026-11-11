"use client";

import Image from "next/image";
import logo from "../raleigh-ortho-logo.png";
import Link from "next/link";
import { useRouter } from "next/navigation";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function Header() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch(`${BACKEND}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // best-effort logout
    }
    router.replace("/");
  };

  return (
    <div className="header">
      <nav className="navbar">
        <Link href="/therapist-dashboard">
          <Image src={logo} alt="Raleigh Ortho Logo" width={100} height={100} />
        </Link>
        <ul>
          <li><Link href="/therapist-library">My Library</Link></li>
          <li><Link href="/preset-programs">Preset Programs</Link></li>
          <li><Link href="/exercises">Exercises</Link></li>
          <li><Link href="/therapist-dashboard/my-patients">My Patients</Link></li>
          <li><Link href="/patients">Patient Search</Link></li>
          <li>
            <button type="button" className="logout-button" onClick={handleLogout} style={{border: "none"}}>Logout</button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
