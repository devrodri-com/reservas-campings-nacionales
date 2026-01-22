export type ReservaEstado = "confirmada" | "cancelada";
export type CreatedByMode = "public" | "admin";

export type Reserva = {
  id: string;
  campingId: string;

  checkInDate: string;  // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD

  parcelas: number;
  adultos: number;
  menores: number;

  titularNombre: string;
  titularEmail: string;
  titularTelefono: string;
  titularEdad: number;

  estado: ReservaEstado;
  montoTotalArs: number;

  createdAtMs: number; // para ordenar sin depender de Timestamp en el cliente
  cancelMotivo?: string;
  createdByUid?: string;
  createdByMode?: CreatedByMode;
};
