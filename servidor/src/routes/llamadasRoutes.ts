import { Router, Request, Response } from 'express';
import { pool } from '../config/db';

const router = Router();

// Función auxiliar para formatear la fecha a formato SQL válido
function normalizarFechaMySQL(raw: any): string {
  let date: Date;

  if (!raw) {
    date = new Date();
  } else if (typeof raw === 'number' || !isNaN(Number(raw))) {
    // Si viene como timestamp en milisegundos desde Android (ej. 1788301167632)
    date = new Date(Number(raw));
  } else {
    // Si viene como string ISO o texto
    date = new Date(raw);
  }

  // Si la conversión falla, asignar fecha actual
  if (isNaN(date.getTime())) {
    date = new Date();
  }

  // Formato: YYYY-MM-DD HH:MM:SS
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

// GET /api/llamadas -> Consulta para el Dashboard
router.get('/', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM llamadas ORDER BY fecha_hora DESC');
    res.json(rows);
  } catch (error: any) {
    console.error('Error al obtener llamadas:', error);
    res.status(500).json({ error: 'Error interno al consultar llamadas', detalle: error.message });
  }
});

// POST /api/llamadas -> Recibe eventos desde Android
router.post('/', async (req: Request, res: Response) => {
  console.log('>>> [POST /api/llamadas] Body recibido:', JSON.stringify(req.body, null, 2));

  // Soporte para camelCase y snake_case
  const numero = req.body.numeroTelefono || req.body.numero || req.body.numero_telefono;
  const tipo = req.body.tipoLlamada || req.body.tipo || req.body.tipo_llamada;
  const nombre = req.body.nombreContacto || req.body.nombre_contacto || req.body.usuario_nombre || null;
  const duracion = req.body.duracionSegundos ?? req.body.duracion ?? req.body.duracion_segundos ?? 0;
  const estado = req.body.estadoLlamada || req.body.estado || req.body.estado_llamada || null;
  const dispositivo = req.body.idDispositivo || req.body.id_dispositivo || req.body.dispositivo || 'DESCONOCIDO';

  // Fecha normalizada lista para MySQL
  const fechaSQL = normalizarFechaMySQL(req.body.fechaHora || req.body.fecha_hora);

  if (!numero || !tipo) {
    console.warn('>>> Validación rechazada. Faltan campos requeridos:', { numero, tipo });
    return res.status(400).json({ error: 'El número y el tipo de llamada son obligatorios' });
  }

  try {
    const query = `
      INSERT INTO llamadas 
      (numero_telefono, nombre_contacto, tipo_llamada, fecha_hora, duracion_segundos, estado_llamada, id_dispositivo)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(query, [
      numero,
      nombre,
      tipo,
      fechaSQL,
      duracion,
      estado,
      dispositivo
    ]);

    console.log('>>> Guardado exitoso en MySQL con ID:', (result as any).insertId);

    return res.status(201).json({
      success: true,
      message: 'Llamada registrada correctamente',
      id: (result as any).insertId
    });
  } catch (error: any) {
    console.error('>>> Error al insertar en MySQL:', error);
    return res.status(500).json({ error: 'Error interno al guardar la llamada', detalle: error.message });
  }
});

export default router;