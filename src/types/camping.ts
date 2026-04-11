export type InventoryMode = "capacity" | "unit_based";

export type Camping = {
  id: string;
  areaProtegida: string;
  nombre: string;
  ubicacionTexto: string;
  titular: string;
  capacidadParcelas: number;
  precioNocheArs: number;
  maxPersonasPorParcela: number;
  checkInHour: number;
  checkOutHour: number;
  activo: boolean;
  inventoryMode?: InventoryMode;
  /** Opcional. Descripción breve para página de detalle. */
  descripcionCorta?: string;
  /** Opcional. URL de Instagram. */
  igUrl?: string;
  /** Opcional. URL del sitio oficial. */
  webUrl?: string;
  /** Opcional. Configuración de pagos (sin credenciales). */
  paymentsProvider?: "mercadopago";
  mpEnabled?: boolean;
  mpAccountLabel?: string;
  /** Clave de env para token MP (ej: "MP_TOKEN_TALAMPAYA"). */
  mpTokenEnvKey?: string;
  /** Opcional. URL de imagen de portada. */
  coverImageUrl?: string;
  /** Opcional. Dirección del camping. */
  direccion?: string;
  /** Opcional. URL de Google Maps. */
  mapsUrl?: string;
  /** Opcional. URL embebida de Google Maps (iframe src). */
  mapsEmbedUrl?: string;
};
