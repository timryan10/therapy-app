import Image from "next/image";
import logo from "./raleigh-ortho-logo.png";

export default function TherapistDashboard() {
  return (
    <div className="main">
        <div className="header">
            <nav className="navbar">
            <Image src={logo} alt="Raleigh Ortho Logo" width={100} height={100} />
                <ul>
                    <li>Exercises</li>
                    <li>Patients</li>
                </ul>
            </nav>
        </div>
        <div className="content">
            <div className="new-hep">
                <h2>New HEP</h2>
            </div>
        </div>
    </div>
  );
}