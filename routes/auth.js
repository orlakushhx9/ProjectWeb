const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateTokens, verifyToken, isTokenExpiringSoon } = require('../utils/jwt');

const router = express.Router();

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
            name: user.name
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
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Verificar contraseña
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Generar tokens JWT
        const tokens = generateTokens({
            id: user.id,
            email: user.email,
            name: user.name
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
            name: user.name
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

module.exports = router;
