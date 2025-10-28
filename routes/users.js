const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken, requireAdmin, requireStudentAccess, requireParentAccess } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Endpoints para gestión de usuarios
 */

// Middleware de autenticación importado desde middleware/auth.js

// Obtener perfil del usuario autenticado
/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Token de acceso requerido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Token inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Usuario no encontrado
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
router.get('/profile', authenticateToken, async (req, res) => {
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
        console.error('Error al obtener perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Actualizar perfil del usuario
router.put('/profile', authenticateToken, [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
    body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Debe proporcionar un email válido')
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

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Verificar si el email ya existe en otro usuario
        if (req.body.email && req.body.email !== user.email) {
            const existingUser = await User.findByEmail(req.body.email);
            if (existingUser && existingUser.id !== user.id) {
                return res.status(409).json({
                    success: false,
                    message: 'El email ya está en uso por otro usuario'
                });
            }
        }

        // Actualizar usuario
        const updatedUser = await user.update(req.body);

        res.json({
            success: true,
            message: 'Perfil actualizado exitosamente',
            data: {
                user: updatedUser.toJSON()
            }
        });

    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Eliminar cuenta del usuario
router.delete('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        await user.delete();

        res.json({
            success: true,
            message: 'Cuenta eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar cuenta:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== RUTAS DE ADMINISTRADOR =====

// Obtener todos los usuarios (solo admin)
router.get('/all', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const users = await User.findAll();
        
        res.json({
            success: true,
            data: {
                users: users.map(user => user.toJSON())
            }
        });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener usuarios por rol (solo admin)
router.get('/by-role/:role', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { role } = req.params;
        const validRoles = ['admin', 'profesor', 'estudiante', 'padre'];
        
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Rol inválido'
            });
        }
        
        const users = await User.findByRole(role);
        
        res.json({
            success: true,
            data: {
                users: users.map(user => user.toJSON())
            }
        });
    } catch (error) {
        console.error('Error al obtener usuarios por rol:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Cambiar rol de usuario (solo admin) - Ruta simplificada
router.put('/:userId/role', authenticateToken, requireAdmin, [
    body('role')
        .isIn(['admin', 'profesor', 'estudiante', 'padre'])
        .withMessage('Rol inválido'),
    body('parent_id')
        .optional()
        .custom((value) => {
            // Permitir valores nulos, vacíos o números enteros válidos
            if (value === null || value === '' || value === undefined) {
                return true;
            }
            const numValue = parseInt(value);
            return !isNaN(numValue) && numValue > 0;
        })
        .withMessage('parent_id debe ser un número entero válido o nulo')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        console.log('Errores de validación:', errors.array());
        console.log('Datos recibidos:', req.body);
        
        if (!errors.isEmpty()) {
            console.log('Errores específicos:', errors.array());
            return res.status(400).json({
                success: false,
                message: 'Datos de entrada inválidos',
                errors: errors.array(),
                details: errors.array().map(err => `${err.param}: ${err.msg}`)
            });
        }

        const { userId } = req.params;
        const { role, parent_id } = req.body;
        
        // Convertir parent_id a número si no es nulo/vacío
        const parentId = (parent_id && parent_id !== '' && parent_id !== 'null') ? parseInt(parent_id) : null;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Verificar que no se pueda cambiar el rol del último admin
        if (user.isAdmin() && role !== 'admin') {
            const admins = await User.findByRole('admin');
            if (admins.length <= 1) {
                return res.status(400).json({
                    success: false,
                    message: 'No se puede cambiar el rol del último administrador'
                });
            }
        }

        // Actualizar solo el rol y parent_id
        const updatedUser = await user.changeRole(role, parentId);

        res.json({
            success: true,
            message: 'Rol actualizado exitosamente',
            data: {
                user: updatedUser.toJSON()
            }
        });

    } catch (error) {
        console.error('Error al cambiar rol:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== RUTAS DE PADRE =====

// Obtener estudiantes del padre
router.get('/my-students', authenticateToken, requireParentAccess, async (req, res) => {
    try {
        const students = await User.getStudentsByParent(req.userData.id);
        
        res.json({
            success: true,
            data: {
                students: students.map(student => student.toJSON())
            }
        });
    } catch (error) {
        console.error('Error al obtener estudiantes:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;
