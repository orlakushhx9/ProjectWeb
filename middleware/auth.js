const { verifyToken, isTokenExpiringSoon } = require('../utils/jwt');
const User = require('../models/User');

// Middleware para autenticación básica
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

// Middleware para verificar roles específicos
const requireRole = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            // Primero verificar autenticación
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Token de acceso requerido'
                });
            }

            // Obtener información completa del usuario desde la base de datos
            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            // Verificar si el usuario tiene uno de los roles permitidos
            if (!allowedRoles.includes(user.role)) {
                return res.status(403).json({
                    success: false,
                    message: `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}`
                });
            }

            // Agregar información completa del usuario al request
            req.userData = user;
            next();
        } catch (error) {
            console.error('Error en middleware de roles:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    };
};

// Middleware específico para administradores
const requireAdmin = requireRole('admin');

// Middleware específico para profesores
const requireProfessor = requireRole('profesor');

// Middleware específico para estudiantes
const requireStudent = requireRole('estudiante');

// Middleware específico para padres
const requireParent = requireRole('padre');

// Middleware para profesores y administradores
const requireProfessorOrAdmin = requireRole('profesor', 'admin');

// Middleware para verificar acceso a datos de estudiante específico
const requireStudentAccess = async (req, res, next) => {
    try {
        const studentId = req.params.studentId || req.params.id;
        const userData = req.userData;

        // Los administradores pueden acceder a cualquier estudiante
        if (userData.isAdmin()) {
            return next();
        }

        // Los profesores pueden acceder a cualquier estudiante
        if (userData.isProfessor()) {
            return next();
        }

        // Los estudiantes solo pueden acceder a sus propios datos
        if (userData.isStudent() && userData.id == studentId) {
            return next();
        }

        // Los padres pueden acceder a sus hijos
        if (userData.isParent()) {
            const students = await User.getStudentsByParent(userData.id);
            const hasAccess = students.some(student => student.id == studentId);
            
            if (hasAccess) {
                return next();
            }
        }

        return res.status(403).json({
            success: false,
            message: 'No tienes permisos para acceder a estos datos'
        });

    } catch (error) {
        console.error('Error en middleware de acceso a estudiante:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Middleware para verificar acceso a datos de padre específico
const requireParentAccess = async (req, res, next) => {
    try {
        const parentId = req.params.parentId || req.params.id;
        const userData = req.userData;

        // Los administradores pueden acceder a cualquier padre
        if (userData.isAdmin()) {
            return next();
        }

        // Los padres solo pueden acceder a sus propios datos
        if (userData.isParent() && userData.id == parentId) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: 'No tienes permisos para acceder a estos datos'
        });

    } catch (error) {
        console.error('Error en middleware de acceso a padre:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

module.exports = {
    authenticateToken,
    requireRole,
    requireAdmin,
    requireProfessor,
    requireStudent,
    requireParent,
    requireProfessorOrAdmin,
    requireStudentAccess,
    requireParentAccess
};
