const express = require('express');
const User = require('../models/User');
const { authenticateToken, requireParent } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Parent
 *   description: Endpoints para padres - ver información de sus hijos
 */

// ===== RUTAS DE PADRE =====

// Obtener información de los hijos del padre
router.get('/my-children', authenticateToken, requireParent, async (req, res) => {
    try {
        const children = await User.getStudentsByParent(req.userData.id);
        
        res.json({
            success: true,
            data: {
                children: children.map(child => child.toJSON())
            }
        });
    } catch (error) {
        console.error('Error al obtener hijos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener progreso de un hijo específico
router.get('/children/:childId/progress', authenticateToken, requireParent, async (req, res) => {
    try {
        const { childId } = req.params;
        
        // Verificar que el hijo pertenece al padre
        const children = await User.getStudentsByParent(req.userData.id);
        const child = children.find(c => c.id == childId);
        
        if (!child) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para ver los datos de este estudiante'
            });
        }
        
        res.json({
            success: true,
            data: {
                child: child.toJSON(),
                progress: {
                    totalDetections: 0,
                    avgConfidence: 0,
                    totalSessions: 0,
                    signsPracticed: 0,
                    overallProgress: 0,
                    signStats: [],
                    sessions: [],
                    teacherEvaluations: []
                }
            }
        });
    } catch (error) {
        console.error('Error al obtener progreso del hijo:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener resumen de todos los hijos
router.get('/children/summary', authenticateToken, requireParent, async (req, res) => {
    try {
        const children = await User.getStudentsByParent(req.userData.id);
        
        const childrenSummary = children.map(child => ({
            child: child.toJSON(),
            summary: {
                totalDetections: 0,
                avgConfidence: 0,
                totalSessions: 0,
                signsPracticed: 0,
                overallProgress: 0,
                lastActivity: null
            }
        }));
        
        res.json({
            success: true,
            data: {
                childrenSummary
            }
        });
    } catch (error) {
        console.error('Error al obtener resumen de hijos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener actividad reciente de todos los hijos
router.get('/children/recent-activity', authenticateToken, requireParent, async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                recentActivity: []
            }
        });
    } catch (error) {
        console.error('Error al obtener actividad reciente:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;
