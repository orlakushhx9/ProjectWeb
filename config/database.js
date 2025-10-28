const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

// Configuración de la base de datos MySQL
const dbConfig = {
    host: (process.env.DB_HOST || '127.0.0.1').trim(),
    port: Number(process.env.DB_PORT) || 3306,
    user: (process.env.DB_USER || 'root').trim(),
    password: process.env.DB_PASSWORD ?? '',
    database: (process.env.DB_NAME || 'webprojectdb').trim(),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000
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
        
        // Crear tabla de usuarios con roles
        await createUsersTable(pool);
        
        // Crear usuario administrador por defecto
        await createDefaultAdmin(pool);
        
        console.log('Base de datos inicializada correctamente');
    } catch (error) {
        console.error('Error al inicializar la base de datos:', error);
        throw error;
    }
}

// Función para crear la tabla de usuarios
async function createUsersTable(pool) {
    try {
        const createUsersTableQuery = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'profesor', 'estudiante', 'padre') DEFAULT 'estudiante',
                parent_id INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_role (role),
                INDEX idx_parent_id (parent_id),
                FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `;
        
        await pool.execute(createUsersTableQuery);
        console.log('Tabla users creada o verificada exitosamente');
        
        // Verificar si necesitamos agregar las columnas de rol (para bases de datos existentes)
        const [columns] = await pool.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME IN ('role', 'parent_id')
        `);
        
        const existingColumns = columns.map(col => col.COLUMN_NAME);
        
        if (!existingColumns.includes('role')) {
            await pool.execute('ALTER TABLE users ADD COLUMN role ENUM("admin", "profesor", "estudiante", "padre") DEFAULT "estudiante"');
            console.log('Columna role agregada a la tabla users');
        }
        
        if (!existingColumns.includes('parent_id')) {
            await pool.execute('ALTER TABLE users ADD COLUMN parent_id INT NULL');
            await pool.execute('ALTER TABLE users ADD INDEX idx_parent_id (parent_id)');
            await pool.execute('ALTER TABLE users ADD FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL');
            console.log('Columna parent_id agregada a la tabla users');
        }
        
    } catch (error) {
        console.error('Error al crear tabla users:', error);
        throw error;
    }
}

// Función para crear usuario administrador por defecto
async function createDefaultAdmin(pool) {
    try {
        const bcrypt = require('bcryptjs');
        
        // Verificar si ya existe un admin
        const [existingAdmin] = await pool.execute('SELECT id FROM users WHERE role = "admin" LIMIT 1');
        
        if (existingAdmin.length === 0) {
            const adminPassword = await bcrypt.hash('admin123', 10);
            
            await pool.execute(`
                INSERT INTO users (name, email, password, role) 
                VALUES (?, ?, ?, ?)
            `, ['Administrador', 'admin@gestus.com', adminPassword, 'admin']);
            
            console.log('Usuario administrador creado: admin@gestus.com / admin123');
        } else {
            console.log('Usuario administrador ya existe');
        }
    } catch (error) {
        console.error('Error al crear usuario administrador:', error);
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
