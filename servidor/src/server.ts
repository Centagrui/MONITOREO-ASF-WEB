import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import llamadasRoutes from './routes/llamadasRoutes';
import usuariosRoutes from './routes/usuarios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => {
  res.send('API de Monitoreo de Llamadas ASF activa ');
});

app.use('/api/usuarios', usuariosRoutes);
app.use('/api/llamadas', llamadasRoutes);

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
});