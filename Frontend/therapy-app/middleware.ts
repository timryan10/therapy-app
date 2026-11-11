import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/therapist-dashboard",
  "/therapist-library",
  "/preset-programs",
  "/patients",
  "/create-patient",
  "/exercises",
];

const PATIENT_PROTECTED_PREFIXES = [
  "/patient-portal",
];

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isPatientProtectedPath(pathname: string) {
  return PATIENT_PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function withNoStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isProtectedPath(pathname)) {
    const hasSession = Boolean(request.cookies.get("therapist_session")?.value);
    if (hasSession) return withNoStore(NextResponse.next());

    const loginUrl = new URL("/", request.url);
    return withNoStore(NextResponse.redirect(loginUrl));
  }

  if (isPatientProtectedPath(pathname)) {
    const hasPatientSession = Boolean(request.cookies.get("patient_session")?.value);
    const patientId = request.cookies.get("patient_id")?.value;
    if (!hasPatientSession || !patientId) {
      const loginUrl = new URL("/", request.url);
      return withNoStore(NextResponse.redirect(loginUrl));
    }

    const parts = pathname.split("/").filter(Boolean);
    const pathId = parts[1];
    if (!pathId) {
      return withNoStore(NextResponse.redirect(new URL(`/patient-portal/${encodeURIComponent(patientId)}`, request.url)));
    }
    if (pathId !== patientId) {
      return withNoStore(NextResponse.redirect(new URL(`/patient-portal/${encodeURIComponent(patientId)}`, request.url)));
    }
    return withNoStore(NextResponse.next());
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
