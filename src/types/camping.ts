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
  /** Opcional. Descripción breve para página de detalle. */
  descripcionCorta?: string;
  /** Opcional. URL de Instagram. */
  igUrl?: string;
  /** Opcional. URL del sitio oficial. */
  webUrl?: string;
};
