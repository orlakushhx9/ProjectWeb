const express = require('express');
const User = require('../models/User');
const Evaluation = require('../models/Evaluation');
const { authenticateToken, requireStudent } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Student
 *   description: Endpoints para estudiantes - ver sus propios datos y progreso
 */

// ===== RUTAS DE ESTUDIANTE =====

// Obtener historial de intentos del estudiante
router.get('/my-attempts', authenticateToken, requireStudent, async (req, res) => {
    res.json({
        success: true,
        data: {
            attempts: []
        }
    });
});

// Obtener estadísticas del estudiante
router.get('/my-stats', authenticateToken, requireStudent, async (req, res) => {
    res.json({
        success: true,
        data: {
            stats: {
                totalDetections: 0,
                avgConfidence: 0,
                totalSessions: 0,
                signsPracticed: 0,
                signStats: [],
                sessions: []
            }
        }
    });
});

// Obtener sesiones de práctica del estudiante
router.get('/my-sessions', authenticateToken, requireStudent, async (req, res) => {
    res.json({
        success: true,
        data: {
            sessions: []
        }
    });
});

// Obtener progreso del estudiante
router.get('/my-progress', authenticateToken, requireStudent, async (req, res) => {
    res.json({
        success: true,
        data: {
            progress: {
                totalDetections: 0,
                avgConfidence: 0,
                totalSessions: 0,
                signsPracticed: 0,
                overallProgress: 0,
                progressBySign: [],
                teacherEvaluations: []
            }
        }
    });
});

// Obtener evaluaciones del estudiante hechas por profesores
router.get('/my-evaluations', authenticateToken, requireStudent, async (req, res) => {
    try {
        const evaluations = await Evaluation.findByStudent(req.userData.id);
        
        res.json({
            success: true,
            data: {
                evaluations: evaluations,
                total: evaluations.length
            }
        });
    } catch (error) {
        console.error('Error al obtener evaluaciones del estudiante:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener información del padre del estudiante (si tiene uno asignado)
router.get('/my-parent', authenticateToken, requireStudent, async (req, res) => {
    try {
        const parent = await User.getParentByStudent(req.userData.id);
        
        if (!parent) {
            return res.json({
                success: true,
                data: {
                    parent: null,
                    message: 'No tienes un padre asignado'
                }
            });
        }
        
        res.json({
            success: true,
            data: {
                parent: {
                    id: parent.id,
                    name: parent.name,
                    email: parent.email
                }
            }
        });
    } catch (error) {
        console.error('Error al obtener información del padre:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;
