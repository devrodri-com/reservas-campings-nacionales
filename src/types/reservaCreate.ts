export type ReservaCreateInput = {
  campingId: string;
  checkInDate: string;  // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  parcelas: number;     // 1..5
  adultos: number;
  menores: number;
  titularNombre: string;
  titularEmail: string;
  titularTelefono: string;
  titularEdad: number;
  password?: string;   // opcional
};
