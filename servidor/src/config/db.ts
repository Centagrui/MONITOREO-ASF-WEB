import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'monitoreo_llamadas',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '-06:00',
  dateStrings: true
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

  /*

  import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '-06:00', // Mantiene la hora de México en MariaDB
  dateStrings: true
});

// Comprobar enlace con el servidor de la empresa al arrancar
pool.getConnection()
  .then((conn) => {
    console.log(' Conectado exitosamente a MariaDB (Servidor Empresa)');
    conn.release();
  })
  .catch((err) => {
    console.error(' Error de enlace con MariaDB:', err.message);
  });
  */