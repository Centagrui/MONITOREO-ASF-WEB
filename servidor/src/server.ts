import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool as db } from './config/db';
import llamadasRoutes from './routes/llamadasRoutes';
import usuariosRoutes from './routes/usuarios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req: Request, res: Response) => {
  res.send('API de Monitoreo de Llamadas ASF activa');
});

// Endpoint de login adaptado a mysql2/promise (async/await)
app.post('/api/admin/login', async (req: Request, res: Response): Promise<void> => {
  const { usuario, password } = req.body;

  try {
    const query = 'SELECT id, usuario FROM administradores WHERE usuario = ? AND password = ?';
    // db.query solo recibe (query, valores) cuando usa promesas
    const [rows]: any = await db.query(query, [usuario, password]);

    if (!rows || rows.length === 0) {
      res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
      return;
    }

    res.json({ autenticado: true, admin: rows[0].usuario });
  } catch (err) {
    console.error('Error al autenticar administrador:', err);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
});

app.use('/api/usuarios', usuariosRoutes);
app.use('/api/llamadas', llamadasRoutes);

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
});