const express = require('express');
const Evaluation = require('../models/Evaluation');
const GestureAttempt = require('../models/GestureAttempt');
const User = require('../models/User');
const { authenticateToken, requireStudent } = require('../middleware/auth');
const { getGestureAttemptsForUser } = require('../services/firebaseAdmin');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Student
 *   description: Endpoints para estudiantes - ver sus evaluaciones y prácticas
 */

// Obtener evaluaciones del estudiante autenticado desde la tabla evaluations de Railway
router.get('/my-evaluations', authenticateToken, requireStudent, async (req, res) => {
    try {
        const studentId = req.userData.id;
        
        console.log(`[API] Obteniendo evaluaciones para estudiante ID: ${studentId}`);
        
        // Obtener evaluaciones desde la base de datos Railway (tabla evaluations)
        const evaluations = await Evaluation.findByStudent(studentId);
        
        console.log(`[API] Evaluaciones encontradas: ${evaluations.length}`);
        
        // Convertir a formato JSON
        const evaluationsData = evaluations.map(eval => eval.toJSON());
        
        res.json({
            success: true,
            data: {
                evaluations: evaluationsData,
                total: evaluationsData.length
            }
        });
    } catch (error) {
        console.error('[API] Error al obtener evaluaciones del estudiante:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al obtener evaluaciones',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Obtener intentos/prácticas del estudiante desde Railway
router.get('/my-attempts', authenticateToken, requireStudent, async (req, res) => {
    try {
        const studentId = req.userData.id;
        const student = await User.findById(studentId);
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Estudiante no encontrado'
            });
        }
        
        console.log(`[API] Obteniendo intentos de gestos para estudiante ID: ${studentId}`);
        
        // Obtener intentos desde la base de datos Railway (tabla gesture_attempts)
        const attempts = await GestureAttempt.findByStudent(studentId);
        
        console.log(`[API] Intentos encontrados: ${attempts.length}`);
        
        // Función helper para determinar el estado según la puntuación
        function getPerformanceStatus(score) {
            if (score >= 90) return 'excellent';
            if (score >= 70) return 'good';
            if (score >= 50) return 'fair';
            return 'poor';
        }
        
        // Convertir a formato JSON
        const attemptsData = attempts.map(attempt => {
            const json = attempt.toJSON();
            return {
                ...json,
                status: getPerformanceStatus(json.score)
            };
        });

        res.json({
            success: true,
            data: {
                attempts: attemptsData,
                total: attemptsData.length
            }
        });
    } catch (error) {
        console.error('[API] Error al obtener intentos del estudiante:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al obtener intentos',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Obtener intentos/prácticas del estudiante desde Firebase
router.get('/my-firebase-attempts', authenticateToken, requireStudent, async (req, res) => {
    try {
        const studentId = req.userData.id;
        const student = await User.findById(studentId);
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Estudiante no encontrado'
            });
        }
        
        // Verificar si el estudiante tiene firebase_uid
        if (!student.firebase_uid) {
            console.log(`[API] Estudiante ${studentId} no tiene firebase_uid asociado`);
            return res.json({
                success: true,
                data: {
                    attempts: [],
                    summary: {
                        totalAttempts: 0,
                        averageScore: 0,
                        lastPractice: null,
                        bestScore: 0,
                        progressPercent: 0
                    },
                    message: 'El estudiante no tiene una cuenta de Firebase asociada'
                }
            });
        }
        
        console.log(`[API] Obteniendo intentos de Firebase para estudiante ID: ${studentId}, Firebase UID: ${student.firebase_uid}`);
        
        // Obtener intentos desde Firebase
        const firebaseData = await getGestureAttemptsForUser(student.firebase_uid);
        
        console.log(`[API] Intentos de Firebase encontrados: ${firebaseData.attempts.length}`);
        
        // Función helper para determinar el estado según la puntuación
        function getPerformanceStatus(score) {
            if (score >= 90) return 'excellent';
            if (score >= 70) return 'good';
            if (score >= 50) return 'fair';
            return 'poor';
        }
        
        // Convertir a formato compatible con el frontend
        const attemptsData = firebaseData.attempts.map(attempt => {
            // Normalizar fecha
            let date = attempt.timestamp;
            if (typeof date === 'number') {
                date = new Date(date).toISOString();
            } else if (typeof date === 'string' && !date.includes('T')) {
                date = new Date(date).toISOString();
            }
            
            // Normalizar puntuación
            let score = attempt.percentage || 0;
            if (typeof score === 'string') {
                score = parseFloat(score) || 0;
            }
            score = Math.max(0, Math.min(100, Math.round(score)));
            
            return {
                id: attempt.id || `firebase-${Date.now()}`,
                gestureId: attempt.gestureId || null,
                date: date,
                sign: attempt.sign || 'Gesto',
                score: score,
                status: getPerformanceStatus(score),
                type: 'firebase', // Marcar como dato de Firebase
                raw: attempt.raw || attempt, // Guardar datos originales
                source: 'firebase'
            };
        });

        res.json({
            success: true,
            data: {
                attempts: attemptsData,
                summary: firebaseData.summary,
                total: attemptsData.length
            }
        });
    } catch (error) {
        console.error('[API] Error al obtener intentos de Firebase del estudiante:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al obtener intentos de Firebase',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Obtener estadísticas del estudiante desde Firebase
router.get('/my-firebase-stats', authenticateToken, requireStudent, async (req, res) => {
    try {
        const studentId = req.userData.id;
        const student = await User.findById(studentId);
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Estudiante no encontrado'
            });
        }
        
        // Verificar si el estudiante tiene firebase_uid
        if (!student.firebase_uid) {
            return res.json({
                success: true,
                data: {
                    totalAttempts: 0,
                    averageScore: 0,
                    lastPractice: null,
                    bestScore: 0,
                    progressPercent: 0
                }
            });
        }
        
        console.log(`[API] Obteniendo estadísticas de Firebase para estudiante ID: ${studentId}, Firebase UID: ${student.firebase_uid}`);
        
        // Obtener datos desde Firebase
        const firebaseData = await getGestureAttemptsForUser(student.firebase_uid);
        
        res.json({
            success: true,
            data: firebaseData.summary
        });
    } catch (error) {
        console.error('[API] Error al obtener estadísticas de Firebase del estudiante:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al obtener estadísticas de Firebase',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
