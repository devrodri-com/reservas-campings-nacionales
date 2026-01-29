"use client";

import { auth } from "@/lib/firebase";
import {
  EmailAuthProvider,
  linkWithCredential,
  signInAnonymously,
} from "firebase/auth";

export async function ensureSignedInGuest(): Promise<string> {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("No se pudo obtener sesión");
  return uid;
}

export async function ensureSignedInGuestOrLink(params: {
  email: string;
  password?: string;
}): Promise<void> {
  const { email, password } = params;

  // Si no hay usuario, iniciar anónimo
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }

  // Si hay password, intentar vincular la cuenta anónima a email/password
  if (password && password.length > 0) {
    const user = auth.currentUser;
    if (!user) return;

    // Si ya es una cuenta no anónima, no hacemos nada
    if (!user.isAnonymous) return;

    const credential = EmailAuthProvider.credential(email, password);
    await linkWithCredential(user, credential);
  }
}
