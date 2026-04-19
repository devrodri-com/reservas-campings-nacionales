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
  /** Opcional. Servicios del camping (texto editorial; p. ej. un ítem por línea). */
  serviciosTexto?: string;
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

  /** Política de cancelación V1 (por camping). Si no está habilitada, se usa 100 % de devolución sobre lo pagado. */
  cancellationPolicyEnabled?: boolean;
  /** Días de anticipación (calendario) respecto al check-in original para aplicar el porcentaje “antes”. */
  cancellationRefundDaysThreshold?: number;
  /** Porcentaje de devolución si quedan >= `cancellationRefundDaysThreshold` días hasta el check-in original. */
  cancellationRefundPercentBeforeThreshold?: number;
  /** Porcentaje de devolución si quedan < `cancellationRefundDaysThreshold` días. */
  cancellationRefundPercentAfterThreshold?: number;
};
