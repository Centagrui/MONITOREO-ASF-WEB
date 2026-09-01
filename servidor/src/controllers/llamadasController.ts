import { Request, Response } from 'express';
import { pool } from '../config/db.js';

export const registrarLlamada = async (req: Request, res: Response): Promise<void> => {
  console.log('>>> BODY RECIBIDO EN NODE:', JSON.stringify(req.body, null, 2));

  try {
    const numero = req.body.numeroTelefono || req.body.numero_telefono || req.body.numero;
    const tipo = req.body.tipoLlamada || req.body.tipo_llamada || req.body.tipo;
    const nombre = req.body.nombreContacto || req.body.nombre_contacto || req.body.nombre || null;
    const duracion = req.body.duracionSegundos ?? req.body.duracion_segundos ?? req.body.duracion ?? 0;
    const estado = req.body.estadoLlamada || req.body.estado_llamada || req.body.estado || null;
    const dispositivo = req.body.idDispositivo || req.body.id_dispositivo || 'DESCONOCIDO';

    let fechaHora = new Date();
    if (req.body.fechaHora || req.body.fecha_hora) {
      const rawFecha = req.body.fechaHora || req.body.fecha_hora;
      fechaHora = !isNaN(Number(rawFecha)) ? new Date(Number(rawFecha)) : new Date(rawFecha);
    }

    if (!numero || !tipo) {
      console.warn('>>> VALIDACIÓN FALLIDA. Campos recibidos:', { numero, tipo });
      res.status(400).json({ error: 'El número y el tipo de llamada son obligatorios' });
      return;
    }

    const query = `
      INSERT INTO llamadas 
      (numero_telefono, nombre_contacto, tipo_llamada, fecha_hora, duracion_segundos, estado_llamada, id_dispositivo)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      numero,
      nombre,
      tipo,
      fechaHora,
      duracion,
      estado,
      dispositivo
    ]);

    console.log('>>> GUARDADO EXITOSO EN MYSQL. ID:', (result as any).insertId);
    res.status(201).json({ 
      mensaje: 'Llamada registrada correctamente', 
      id: (result as any).insertId 
    });
  } catch (error: any) {
    console.error('>>> ERROR AL GUARDAR EN MYSQL:', error);
    res.status(500).json({ error: 'Error interno del servidor', detalle: error.message });
  }
};