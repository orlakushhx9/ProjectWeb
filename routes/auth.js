const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateTokens, verifyToken, isTokenExpiringSoon } = require('../utils/jwt');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Endpoints para autenticación de usuarios
 */

// Middleware para validar token JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token de acceso requerido' 
        });
    }

    try {
        const user = verifyToken(token);
        req.user = user;
        
        // Verificar si el token está próximo a expirar
        if (isTokenExpiringSoon(token)) {
            res.set('X-Token-Expiring-Soon', 'true');
        }
        
        next();
    } catch (error) {
        return res.status(403).json({ 
            success: false, 
            message: error.message || 'Token inválido' 
        });
    }
};

// Registro de usuario
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 description: Nombre completo del usuario
 *                 example: "Juan Pérez"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Correo electrónico del usuario
 *                 example: "juan@ejemplo.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Contraseña del usuario
 *                 example: "miPassword123"
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Datos de entrada inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: El email ya está registrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register', [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Debe proporcionar un email válido'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener al menos 6 caracteres')
], async (req, res) => {
    try {
        // Validar datos de entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Datos de entrada inválidos',
                errors: errors.array()
            });
        }

        const { name, email, password } = req.body;

        // Verificar si el usuario ya existe
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }

        // Crear nuevo usuario
        const user = await User.create({ name, email, password });
        
        // Generar tokens JWT
        const tokens = generateTokens({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        });

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                user: user.toJSON(),
                ...tokens
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Login de usuario
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión de usuario
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Correo electrónico del usuario
 *                 example: "juan@ejemplo.com"
 *               password:
 *                 type: string
 *                 description: Contraseña del usuario
 *                 example: "miPassword123"
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Datos de entrada inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Debe proporcionar un email válido'),
    body('password')
        .notEmpty()
        .withMessage('La contraseña es requerida')
], async (req, res) => {
    try {
        // Validar datos de entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Datos de entrada inválidos',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Buscar usuario por email
        const user = await User.findByEmail(email);
        if (!user) {
            console.log(`❌ [LOGIN] Usuario no encontrado: ${email}`);
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        console.log(`✓ [LOGIN] Usuario encontrado: ${email}`);
        console.log(`  - ID: ${user.id}`);
        console.log(`  - Nombre: ${user.name}`);
        console.log(`  - Role: ${user.role}`);
        console.log(`  - Password en BD (primeros 20 chars): ${user.password.substring(0, 20)}`);
        console.log(`  - Password ingresada: ${password.substring(0, 3)}***`);

        // Verificar contraseña
        const isPasswordValid = await user.comparePassword(password);
        
        console.log(`  - ¿Password válida?: ${isPasswordValid ? '✓ SÍ' : '❌ NO'}`);
        
        if (!isPasswordValid) {
            console.log(`❌ [LOGIN] Contraseña incorrecta para ${email}`);
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        console.log(`✓ [LOGIN] Login exitoso para ${email}`);

        // Generar tokens JWT
        const tokens = generateTokens({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        });

        res.json({
            success: true,
            message: 'Login exitoso',
            data: {
                user: user.toJSON(),
                ...tokens
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Verificar token
router.get('/verify', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            data: {
                user: user.toJSON()
            }
        });

    } catch (error) {
        console.error('Error al verificar token:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Refresh token
router.post('/refresh', [
    body('refreshToken')
        .notEmpty()
        .withMessage('Refresh token es requerido')
], async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        // Verificar refresh token
        const decoded = verifyToken(refreshToken);
        
        // Buscar usuario
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        // Generar nuevos tokens
        const tokens = generateTokens({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        });
        
        res.json({
            success: true,
            message: 'Tokens renovados exitosamente',
            data: {
                user: user.toJSON(),
                ...tokens
            }
        });
        
    } catch (error) {
        console.error('Error en refresh token:', error);
        res.status(401).json({
            success: false,
            message: 'Refresh token inválido o expirado'
        });
    }
});

// Logout (opcional, ya que JWT es stateless)
router.post('/logout', (req, res) => {
    res.json({
        success: true,
        message: 'Logout exitoso'
    });
});

// Cambiar contraseña (para usuarios autenticados)
/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Cambiar contraseña del usuario autenticado
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Contraseña actual del usuario
 *                 example: "oldPassword123"
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: Nueva contraseña
 *                 example: "newPassword123"
 *     responses:
 *       200:
 *         description: Contraseña cambiada exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: Contraseña actual incorrecta
 *       500:
 *         description: Error interno del servidor
 */
router.post('/change-password', authenticateToken, [
    body('currentPassword')
        .notEmpty()
        .withMessage('La contraseña actual es requerida'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('La nueva contraseña debe tener al menos 6 caracteres')
], async (req, res) => {
    try {
        // Validar datos de entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Datos de entrada inválidos',
                errors: errors.array()
            });
        }

        const { currentPassword, newPassword } = req.body;

        // Buscar usuario
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Verificar contraseña actual
        const isPasswordValid = await user.comparePassword(currentPassword);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'La contraseña actual es incorrecta'
            });
        }

        // Actualizar contraseña con SHA-256
        const crypto = require('crypto');
        const hashedPassword = crypto.createHash('sha256').update(newPassword).digest('hex');
        
        const { getConnection } = require('../config/database');
        const pool = await getConnection();
        
        await pool.execute(
            'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [hashedPassword, user.id]
        );

        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });

    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;
