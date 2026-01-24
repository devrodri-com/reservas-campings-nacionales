import type { Camping } from "@/types/camping";

export function resolveMercadoPagoToken(camping: Camping): string | null {
  if (!camping.mpEnabled) return null;
  if (!camping.mpTokenEnvKey) return null;

  const token = process.env[camping.mpTokenEnvKey];
  if (!token) return null;

  return token;
}
