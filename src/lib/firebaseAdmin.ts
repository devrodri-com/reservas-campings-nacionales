import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

function getServiceAccount(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON no configurado");

  const parsed = JSON.parse(raw) as { project_id: string; client_email: string; private_key: string };

  if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
    throw new Error("Service account JSON incompleto");
  }

  return {
    projectId: parsed.project_id,
    clientEmail: parsed.client_email,
    privateKey: parsed.private_key.replace(/\\n/g, "\n"),
  };
}

function ensureAdminApp(): void {
  if (!getApps().length) {
    const sa = getServiceAccount();
    initializeApp({
      credential: cert(sa),
    });
  }
}

export function adminDb() {
  ensureAdminApp();
  return getFirestore();
}

export function adminAuth() {
  ensureAdminApp();
  return getAuth();
}
