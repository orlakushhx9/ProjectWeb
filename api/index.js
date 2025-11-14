const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Cargar variables de entorno
// En Vercel, las variables se cargan automáticamente desde el entorno
// En desarrollo local, intenta cargar desde config.env
try {
    const configPath = path.join(__dirname, '..', 'config.env');
    require('dotenv').config({ path: configPath });
} catch (error) {
    // Si no existe config.env, usar variables de entorno del sistema
    require('dotenv').config();
}

const { initializeDatabase, testConnection } = require('../config/database');
const authRoutes = require('../routes/auth');
const userRoutes = require('../routes/users');
const professorRoutes = require('../routes/professor');
const studentRoutes = require('../routes/student');
const parentRoutes = require('../routes/parent');
const rolesRoutes = require('../routes/roles');

const app = express();

// Configuración de Swagger
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Sistema Web Gestus API',
            version: '1.0.0',
            description: 'API para el Sistema Web Gestus - Plataforma educativa',
            contact: {
                name: 'Equipo Gestus',
                email: 'info@gestus.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: process.env.VERCEL_URL 
                    ? `https://${process.env.VERCEL_URL}` 
                    : 'http://localhost:5000',
                description: 'Servidor de producción'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'ID único del usuario'
                        },
                        name: {
                            type: 'string',
                            description: 'Nombre completo del usuario'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'Correo electrónico del usuario'
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Fecha de creación del usuario'
                        },
                        updated_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Fecha de última actualización'
                        }
                    }
                },
                AuthResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            description: 'Indica si la operación fue exitosa'
                        },
                        message: {
                            type: 'string',
                            description: 'Mensaje descriptivo de la respuesta'
                        },
                        data: {
                            type: 'object',
                            properties: {
                                user: {
                                    $ref: '#/components/schemas/User'
                                },
                                accessToken: {
                                    type: 'string',
                                    description: 'Token de acceso JWT'
                                },
                                refreshToken: {
                                    type: 'string',
                                    description: 'Token de renovación JWT'
                                }
                            }
                        }
                    }
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        message: {
                            type: 'string',
                            description: 'Mensaje de error'
                        },
                        errors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    msg: {
                                        type: 'string'
                                    },
                                    param: {
                                        type: 'string'
                                    },
                                    location: {
                                        type: 'string'
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: [path.join(__dirname, '..', 'routes', '*.js')]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Configuración de CORS para producción
const corsOptions = {
    origin: function (origin, callback) {
        // Permitir todos los orígenes (Vercel maneja el CORS automáticamente)
        callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/professor', professorRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/roles', rolesRoutes);

// Documentación Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas para páginas HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'views', 'index.html'));
});

app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'views', 'home.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'views', 'login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'views', 'dashboard.html'));
});

app.get('/app-shell', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'views', 'app-shell.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'views', 'admin.html'));
});

app.get('/professor', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'views', 'professor.html'));
});

app.get('/student', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'views', 'student.html'));
});

app.get('/parent', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'views', 'parent.html'));
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

// Variable para almacenar el estado de inicialización
let dbInitialized = false;

// Función para inicializar la base de datos (solo una vez)
async function initializeDB() {
    if (dbInitialized) {
        return;
    }
    
    try {
        console.log('Inicializando base de datos...');
        const connectionTest = await testConnection();
        if (!connectionTest) {
            throw new Error('No se pudo establecer conexión con la base de datos');
        }
        await initializeDatabase();
        dbInitialized = true;
        console.log('Base de datos inicializada correctamente');
    } catch (error) {
        console.error('Error al inicializar la base de datos:', error.message);
        // No lanzar error para que la función serverless pueda responder
    }
}

// Inicializar DB al cargar el módulo (solo en Vercel)
if (process.env.VERCEL) {
    initializeDB().catch(console.error);
}

// Exportar como función serverless para Vercel
module.exports = async (req, res) => {
    // Inicializar DB si no está inicializada (para desarrollo local)
    if (!dbInitialized && !process.env.VERCEL) {
        await initializeDB();
    }
    
    // Pasar la solicitud a Express
    return app(req, res);
};

