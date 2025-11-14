const express = require('express');
const User = require('../models/User');
const { authenticateToken, requireParent } = require('../middleware/auth');
const { getGestureAttemptsForUser } = require('../services/firebaseAdmin');

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
        const detailedChildren = [];

        for (const child of children) {
            const childJson = child.toJSON();

            let gestureData = {
                summary: {
                    totalAttempts: 0,
                    averageScore: 0,
                    lastPractice: null,
                    bestScore: 0,
                    progressPercent: 0
                },
                attempts: []
            };

            try {
                gestureData = await getGestureAttemptsForUser(childJson.firebase_uid);
            } catch (error) {
                console.warn(`No se pudo obtener gestos para el estudiante ${childJson.id}:`, error.message);
            }

            detailedChildren.push({
                child: childJson,
                stats: gestureData.summary,
                attempts: gestureData.attempts
            });
        }

        res.json({
            success: true,
            data: {
                children: detailedChildren
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

        let gestureData = {
            summary: {
                totalAttempts: 0,
                averageScore: 0,
                lastPractice: null,
                bestScore: 0,
                progressPercent: 0
            },
            attempts: []
        };

        try {
            gestureData = await getGestureAttemptsForUser(child.firebase_uid);
        } catch (error) {
            console.warn(`No se pudo obtener gestos para el estudiante ${child.id}:`, error.message);
        }
        
        res.json({
            success: true,
            data: {
                child: child.toJSON(),
                progress: gestureData.summary,
                attempts: gestureData.attempts
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
        const childrenSummary = [];

        for (const child of children) {
            const childJson = child.toJSON();

            let gestureData = {
                summary: {
                    totalAttempts: 0,
                    averageScore: 0,
                    lastPractice: null,
                    bestScore: 0,
                    progressPercent: 0
                },
                attempts: []
            };

            try {
                gestureData = await getGestureAttemptsForUser(childJson.firebase_uid);
            } catch (error) {
                console.warn(`No se pudo obtener gestos para el estudiante ${childJson.id}:`, error.message);
            }

            childrenSummary.push({
                child: childJson,
                summary: gestureData.summary
            });
        }
        
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
