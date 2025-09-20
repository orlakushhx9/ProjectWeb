const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: './config.env' });

const { initializeDatabase, testConnection } = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Error interno del servidor' 
    });
});

// Ruta 404
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Ruta no encontrada' 
    });
});

// Inicializar base de datos y iniciar servidor
async function startServer() {
    try {
        console.log('Iniciando servidor...');
        
        // Probar la conexión primero
        const connectionTest = await testConnection();
        if (!connectionTest) {
            throw new Error('No se pudo establecer conexión con la base de datos');
        }
        
        // Inicializar la base de datos
        await initializeDatabase();
        
        // Iniciar el servidor
        app.listen(PORT, () => {
            console.log('Servidor iniciado exitosamente!');
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
            console.log('Frontend disponible en: http://localhost:3000');
            console.log('Base de datos MySQL conectada');
        });
    } catch (error) {
        console.error('Error al iniciar el servidor:', error.message);
        console.error('Sugerencias para solucionar el problema:');
        console.error('   1. Verificar que XAMPP esté ejecutándose');
        console.error('   2. Verificar que MySQL esté activo en XAMPP');
        console.error('   3. Crear la base de datos "webprojectdb" en phpMyAdmin');
        console.error('   4. Verificar la configuración en config.env');
        process.exit(1);
    }
}

startServer();
