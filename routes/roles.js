const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: CRUD operations for user roles management
 */

// ===== CREATE ROLE =====
// Crear nuevo usuario con rol específico
/**
 * @swagger
 * /api/roles/create-user:
 *   post:
 *     summary: Crear nuevo usuario con rol específico
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
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
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Juan Pérez"
 *               email:
 *                 type: string
 *                 example: "juan@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *               role:
 *                 type: string
 *                 enum: [admin, profesor, estudiante, padre]
 *                 example: "profesor"
 *               parent_id:
 *                 type: integer
 *                 nullable: true
 *                 example: 5
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: Token de acceso requerido
 *       403:
 *         description: No tienes permisos de administrador
 */
router.post('/create-user', authenticateToken, requireAdmin, [
    body('name')
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    body('email')
        .isEmail()
        .withMessage('Email inválido'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('role')
        .isIn(['admin', 'profesor', 'estudiante', 'padre'])
        .withMessage('Rol inválido'),
    body('parent_id')
        .optional()
        .isInt()
        .withMessage('parent_id debe ser un número entero')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Datos de entrada inválidos',
                errors: errors.array()
            });
        }

        const { name, email, password, role, parent_id } = req.body;
        
        // Verificar si el email ya existe
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }

        // Crear usuario con rol específico
        const userData = { name, email, password, role };
        if (parent_id) userData.parent_id = parent_id;

        const newUser = await User.create(userData);

        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente',
            data: {
                user: newUser.toJSON()
            }
        });

    } catch (error) {
        console.error('Error creando usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== READ ROLES =====
// Obtener todos los usuarios con sus roles
/**
 * @swagger
 * /api/roles/all:
 *   get:
 *     summary: Obtener todos los usuarios con sus roles
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida exitosamente
 *       401:
 *         description: Token de acceso requerido
 *       403:
 *         description: No tienes permisos de administrador
 */
router.get('/all', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const users = await User.findAll();
        
        res.json({
            success: true,
            data: {
                users: users.map(user => user.toJSON()),
                total: users.length,
                roles: {
                    admin: users.filter(u => u.role === 'admin').length,
                    profesor: users.filter(u => u.role === 'profesor').length,
                    estudiante: users.filter(u => u.role === 'estudiante').length,
                    padre: users.filter(u => u.role === 'padre').length
                }
            }
        });
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener usuarios por rol específico
/**
 * @swagger
 * /api/roles/by-role/{role}:
 *   get:
 *     summary: Obtener usuarios por rol específico
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [admin, profesor, estudiante, padre]
 *         description: Rol a buscar
 *     responses:
 *       200:
 *         description: Usuarios encontrados exitosamente
 *       400:
 *         description: Rol inválido
 *       401:
 *         description: Token de acceso requerido
 *       403:
 *         description: No tienes permisos de administrador
 */
router.get('/by-role/:role', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { role } = req.params;
        
        if (!['admin', 'profesor', 'estudiante', 'padre'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Rol inválido'
            });
        }

        const users = await User.findByRole(role);
        
        res.json({
            success: true,
            data: {
                users: users.map(user => user.toJSON()),
                role: role,
                count: users.length
            }
        });
    } catch (error) {
        console.error('Error obteniendo usuarios por rol:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== UPDATE ROLE =====
// Actualizar rol de usuario
/**
 * @swagger
 * /api/roles/update/{userId}:
 *   put:
 *     summary: Actualizar rol de usuario
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, profesor, estudiante, padre]
 *                 example: "profesor"
 *               parent_id:
 *                 type: integer
 *                 nullable: true
 *                 example: 5
 *     responses:
 *       200:
 *         description: Rol actualizado exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 *       404:
 *         description: Usuario no encontrado
 *       401:
 *         description: Token de acceso requerido
 *       403:
 *         description: No tienes permisos de administrador
 */
router.put('/update/:userId', authenticateToken, requireAdmin, [
    body('role')
        .isIn(['admin', 'profesor', 'estudiante', 'padre'])
        .withMessage('Rol inválido'),
    body('parent_id')
        .optional()
        .custom((value) => {
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
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Datos de entrada inválidos',
                errors: errors.array()
            });
        }

        const { userId } = req.params;
        const { role, parent_id } = req.body;
        
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

        // Actualizar rol
        const parentId = (parent_id && parent_id !== '' && parent_id !== 'null') ? parseInt(parent_id) : null;
        const updatedUser = await user.changeRole(role, parentId);

        res.json({
            success: true,
            message: 'Rol actualizado exitosamente',
            data: {
                user: updatedUser.toJSON()
            }
        });

    } catch (error) {
        console.error('Error actualizando rol:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== DELETE ROLE/USER =====
// Eliminar usuario (solo si no es admin)
/**
 * @swagger
 * /api/roles/delete/{userId}:
 *   delete:
 *     summary: Eliminar usuario
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente
 *       400:
 *         description: No se puede eliminar un administrador
 *       404:
 *         description: Usuario no encontrado
 *       401:
 *         description: Token de acceso requerido
 *       403:
 *         description: No tienes permisos de administrador
 */
router.delete('/delete/:userId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // No permitir eliminar administradores
        if (user.isAdmin()) {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar un administrador'
            });
        }

        await user.delete();

        res.json({
            success: true,
            message: 'Usuario eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error eliminando usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== UTILITY FUNCTIONS =====
// Obtener estadísticas de roles
/**
 * @swagger
 * /api/roles/stats:
 *   get:
 *     summary: Obtener estadísticas de roles
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *       401:
 *         description: Token de acceso requerido
 *       403:
 *         description: No tienes permisos de administrador
 */
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const users = await User.findAll();
        
        const stats = {
            total: users.length,
            roles: {
                admin: users.filter(u => u.role === 'admin').length,
                profesor: users.filter(u => u.role === 'profesor').length,
                estudiante: users.filter(u => u.role === 'estudiante').length,
                padre: users.filter(u => u.role === 'padre').length
            },
            relationships: {
                estudiantes_con_padre: users.filter(u => u.role === 'estudiante' && u.parent_id).length,
                estudiantes_sin_padre: users.filter(u => u.role === 'estudiante' && !u.parent_id).length
            }
        };
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;
