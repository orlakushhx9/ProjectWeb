const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken, requireProfessorOrAdmin, requireStudentAccess } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Professor
 *   description: Endpoints para profesores - gestión de estudiantes y calificaciones
 */

// ===== RUTAS DE PROFESOR =====

// Obtener todos los estudiantes (profesor y admin)
router.get('/students', authenticateToken, requireProfessorOrAdmin, async (req, res) => {
    try {
        const students = await User.findByRole('estudiante');
        
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

// Obtener datos de señas de un estudiante específico
router.get('/students/:studentId/sign-data', authenticateToken, requireProfessorOrAdmin, requireStudentAccess, async (req, res) => {
    res.json({
        success: true,
        data: {
            studentId: parseInt(req.params.studentId),
            signHistory: [],
            signStats: [],
            sessions: []
        }
    });
});

// Obtener estadísticas generales de todos los estudiantes
router.get('/students/stats', authenticateToken, requireProfessorOrAdmin, async (req, res) => {
    try {
        const students = await User.findByRole('estudiante');
        
        const allStats = students.map(student => ({
            student: student.toJSON(),
            signStats: [],
            totalSessions: 0,
            totalDetections: 0,
            avgConfidence: 0
        }));
        
        res.json({
            success: true,
            data: {
                studentsStats: allStats
            }
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Crear evaluación/calificación para un estudiante
router.post('/students/:studentId/evaluation', authenticateToken, requireProfessorOrAdmin, requireStudentAccess, [
    body('sign')
        .notEmpty()
        .withMessage('La seña es requerida'),
    body('score')
        .isFloat({ min: 0, max: 10 })
        .withMessage('La calificación debe estar entre 0 y 10'),
    body('comments')
        .optional()
        .isString()
        .withMessage('Los comentarios deben ser texto')
], async (req, res) => {
    res.json({
        success: true,
        message: 'Funcionalidad de evaluación deshabilitada',
        data: {}
    });
});

// Obtener evaluaciones de un estudiante
router.get('/students/:studentId/evaluations', authenticateToken, requireProfessorOrAdmin, requireStudentAccess, async (req, res) => {
    res.json({
        success: true,
        data: {
            evaluations: []
        }
    });
});

// Obtener progreso de un estudiante específico
router.get('/students/:studentId/progress', authenticateToken, requireProfessorOrAdmin, requireStudentAccess, async (req, res) => {
    res.json({
        success: true,
        data: {
            studentId: parseInt(req.params.studentId),
            progress: {
                totalDetections: 0,
                avgConfidence: 0,
                totalSessions: 0,
                signsPracticed: 0,
                signStats: [],
                evaluationScores: []
            }
        }
    });
});

module.exports = router;
