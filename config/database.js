const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la base de datos MySQL
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'webprojectdb',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Variable global para la conexión
let pool;

// Función para obtener la conexión
async function getConnection() {
    try {
        if (!pool) {
            console.log('Intentando conectar a MySQL...');
            console.log('Host:', dbConfig.host);
            console.log('Base de datos:', dbConfig.database);
            console.log('Usuario:', dbConfig.user);
            
            pool = mysql.createPool(dbConfig);
            console.log('Conectado exitosamente a MySQL');
        }
        return pool;
    } catch (error) {
        console.error('Error al conectar con MySQL:', error.message);
        console.error('Configuración utilizada:', {
            host: dbConfig.host,
            database: dbConfig.database,
            user: dbConfig.user
        });
        throw error;
    }
}

// Función para inicializar la base de datos
async function initializeDatabase() {
    try {
        const pool = await getConnection();
        console.log('Conexión a la base de datos establecida');
    } catch (error) {
        console.error('Error al inicializar la base de datos:', error);
        throw error;
    }
}

// Función para probar la conexión
async function testConnection() {
    try {
        console.log('Probando conexión a MySQL...');
        const pool = await getConnection();
        const [rows] = await pool.execute('SELECT VERSION() as version');
        console.log('Conexión exitosa. Versión de MySQL:', rows[0].version);
        return true;
    } catch (error) {
        console.error('Error en la prueba de conexión:', error.message);
        return false;
    }
}

// Función para cerrar la conexión
async function closeConnection() {
    try {
        if (pool) {
            await pool.end();
            pool = null;
            console.log('Conexión a MySQL cerrada');
        }
    } catch (error) {
        console.error('Error al cerrar la conexión:', error);
    }
}

// Manejo de cierre de la aplicación
process.on('SIGINT', closeConnection);
process.on('SIGTERM', closeConnection);

module.exports = {
    getConnection,
    initializeDatabase,
    testConnection,
    closeConnection
};
