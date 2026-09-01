import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'monitoreo_llamadas',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Prueba inicial de conexión
pool.getConnection()
  .then((conn) => {
    console.log('Conexión exitosa a la base de datos MySQL');
    conn.release();
  })
  .catch((err) => {
    console.error('Error al conectar con MySQL:', err.message);
  });