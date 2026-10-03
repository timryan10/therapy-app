import Image from "next/image";
import logo from "../raleigh-ortho-logo.png";
import Link from "next/link";

export default function Header() {
  return (
    <div className="header">
      <nav className="navbar">
        <Link href="/therapist-dashboard">
          <Image src={logo} alt="Raleigh Ortho Logo" width={100} height={100} />
        </Link>
        <ul>
          <li><Link href="/therapist-library">My Library</Link></li>
          <li><Link href="/exercises">Exercises</Link></li>
          <li><Link href="/existing-patients">Patients</Link></li>
        </ul>
      </nav>
    </div>
  );
}
