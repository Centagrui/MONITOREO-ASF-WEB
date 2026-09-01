export interface LlamadaDto {
  numeroTelefono: string;
  nombreContacto?: string | null;
  tipoLlamada: 'SALIENTE' | 'ENTRANTE' | 'PERDIDA';
  fechaHora: number;            // Timestamp en milisegundos
  duracionSegundos: number;
  estadoLlamada: string;        // 'CONTESTADA', 'NO_CONTESTADA'
  idDispositivo: string;        // Identificador del teléfono
}