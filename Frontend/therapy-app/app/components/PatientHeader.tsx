import logo from "../raleigh-ortho-logo.png";

export default function PatientHeader() {
  return (
    <div className="header">
        <nav className="navbar">
            <img src={logo.src} alt="Raleigh Ortho Logo" width={100} height={100} />
        </nav>
    </div>
  );
}