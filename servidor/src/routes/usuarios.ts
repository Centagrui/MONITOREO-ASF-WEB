import { Router } from 'express';
import { pool } from '../config/db';

const router = Router();

// GET /api/usuarios -> Listar todos los usuarios activos
router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre, telefono FROM usuarios WHERE activo = TRUE ORDER BY nombre ASC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ error: 'Error interno al consultar usuarios' });
  }
});

// POST /api/usuarios -> Crear un nuevo usuario
router.post('/', async (req, res) => {
  const { nombre, telefono } = req.body;

  if (!nombre || nombre.trim() === '') {
    return res.status(400).json({ error: 'El nombre del usuario es obligatorio' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre, telefono) VALUES (?, ?)',
      [nombre.trim(), telefono ? telefono.trim() : null]
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      id: (result as any).insertId,
      nombre: nombre.trim(),
      telefono: telefono || null
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: 'Error interno al guardar el usuario' });
  }
});

export default router;