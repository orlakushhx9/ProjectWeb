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

// Obtener historial de intentos del estudiante desde Firebase
router.get('/my-attempts', authenticateToken, requireStudent, async (req, res) => {
    try {
        const student = await User.findById(req.userData.id);
        
        if (!student || !student.isStudent()) {
            return res.status(404).json({
                success: false,
                message: 'Estudiante no encontrado'
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

        // Si el estudiante tiene firebase_uid, obtener gestos de Firebase
        if (student.firebase_uid) {
            try {
                console.log(`[Student] Obteniendo gestos de Firebase para ${student.email} (UID: ${student.firebase_uid})...`);
                const { getGestureAttemptsForUser } = require('../services/firebaseAdmin');
                gestureData = await getGestureAttemptsForUser(student.firebase_uid);
                console.log(`[Student] ✅ Gestos obtenidos para ${student.email}:`, {
                    totalAttempts: gestureData.attempts.length,
                    averageScore: gestureData.summary.averageScore,
                    bestScore: gestureData.summary.bestScore,
                    sampleAttempts: gestureData.attempts.slice(0, 3).map(a => ({
                        sign: a.sign,
                        percentage: a.percentage,
                        timestamp: a.timestamp
                    }))
                });
            } catch (firebaseError) {
                console.error(`[Student] ❌ Error obteniendo gestos de Firebase para ${student.email}:`, firebaseError.message);
                console.error(`[Student] Stack:`, firebaseError.stack);
                // Continuar con datos vacíos si Firebase falla
            }
        } else {
            console.warn(`[Student] ⚠️ Estudiante ${student.email} (ID: ${student.id}) no tiene firebase_uid`);
        }

        console.log(`[Student] Enviando respuesta para ${student.email}:`, {
            totalAttempts: gestureData.attempts.length,
            summary: gestureData.summary
        });
        
        res.json({
            success: true,
            data: {
                attempts: gestureData.attempts,
                summary: gestureData.summary
            }
        });
    } catch (error) {
        console.error('[Student] Error al obtener intentos del estudiante:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
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
