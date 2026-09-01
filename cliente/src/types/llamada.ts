export interface Llamada {
  id: number;
  numero_telefono: string;
  nombre_contacto: string | null;
  tipo_llamada: 'SALIENTE' | 'ENTRANTE' | 'PERDIDA';
  fecha_hora: number;
  duracion_segundos: number;
  estado_llamada: 'CONTESTADA' | 'NO_CONTESTADA';
  id_dispositivo: string;
  fecha_registro: string;
}