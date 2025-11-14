const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken, requireProfessorOrAdmin, requireStudentAccess } = require('../middleware/auth');
const { getGestureAttemptsForUser, getAllGestureAttempts } = require('../services/firebaseAdmin');
const Evaluation = require('../models/Evaluation');

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
        const detailedStudents = [];

        for (const student of students) {
            const studentJson = student.toJSON();

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
                gestureData = await getGestureAttemptsForUser(studentJson.firebase_uid);
            } catch (error) {
                console.warn(`No se pudo obtener gestos para el estudiante ${studentJson.id}:`, error.message);
            }

            detailedStudents.push({
                student: studentJson,
                stats: gestureData.summary,
                attempts: gestureData.attempts
            });
        }

        res.json({
            success: true,
            data: {
                students: detailedStudents
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

// Obtener gestos detectados en Firebase
router.get('/gesture-attempts', authenticateToken, requireProfessorOrAdmin, async (req, res) => {
    try {
        const students = await User.findByRole('estudiante');
        const studentMap = new Map();
        students.forEach(student => {
            if (student.firebase_uid) {
                studentMap.set(student.firebase_uid, student);
            }
        });

        let attemptsByUser = [];
        try {
            attemptsByUser = await getAllGestureAttempts();
        } catch (firebaseError) {
            console.error('Error al obtener gestos de Firebase:', firebaseError);
            // Si Firebase falla, devolver lista vacía en lugar de error 500
            return res.json({
                success: true,
                data: {
                    attempts: [],
                    warning: 'No se pudieron cargar los gestos de Firebase. Verifica la configuración de FIREBASE_SERVICE_ACCOUNT_JSON.'
                }
            });
        }

        const records = [];

        attemptsByUser.forEach(({ firebase_uid, attempts }) => {
            const student = studentMap.get(firebase_uid);
            if (!student) return;

            const studentJson = student.toJSON();
            attempts.forEach(attempt => {
                records.push({
                    student: studentJson,
                    attempt
                });
            });
        });

        records.sort((a, b) => (b.attempt.timestamp || 0) - (a.attempt.timestamp || 0));

        res.json({
            success: true,
            data: {
                attempts: records
            }
        });
    } catch (error) {
        console.error('Error al obtener gestos detectados:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Obtener datos de señas de un estudiante específico
router.get('/students/:studentId/sign-data', authenticateToken, requireProfessorOrAdmin, requireStudentAccess, async (req, res) => {
    try {
        const { studentId } = req.params;
        const student = await User.findById(studentId);

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

        try {
            gestureData = await getGestureAttemptsForUser(student.firebase_uid);
        } catch (error) {
            console.warn(`No se pudo obtener gestos para el estudiante ${student.id}:`, error.message);
        }

        res.json({
            success: true,
            data: {
                student: student.toJSON(),
                attempts: gestureData.attempts,
                summary: gestureData.summary
            }
        });
    } catch (error) {
        console.error('Error al obtener datos de señas del estudiante:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener estadísticas generales de todos los estudiantes
router.get('/students/stats', authenticateToken, requireProfessorOrAdmin, async (req, res) => {
    try {
        const students = await User.findByRole('estudiante');
        const allStats = [];

        for (const student of students) {
            const studentJson = student.toJSON();

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
                gestureData = await getGestureAttemptsForUser(studentJson.firebase_uid);
            } catch (error) {
                console.warn(`No se pudo obtener gestos para el estudiante ${studentJson.id}:`, error.message);
            }

            allStats.push({
                student: studentJson,
                summary: gestureData.summary
            });
        }
        
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
    body('gestureName')
        .notEmpty()
        .withMessage('El gesto es requerido'),
    body('score')
        .isFloat({ min: 0, max: 100 })
        .withMessage('La calificación debe estar entre 0 y 100'),
    body('comments')
        .optional()
        .isString()
        .withMessage('Los comentarios deben ser texto')
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

        const { studentId } = req.params;
        const student = await User.findById(studentId);

        if (!student || !student.isStudent()) {
            return res.status(404).json({
                success: false,
                message: 'Estudiante no encontrado'
            });
        }

        const {
            gestureId = null,
            gestureName,
            attemptId = null,
            attemptTimestamp = null,
            score,
            comments = null,
            status = 'completed'
        } = req.body;

        const evaluation = await Evaluation.create({
            student_id: student.id,
            professor_id: req.userData.id,
            gesture_id: gestureId,
            gesture_name: gestureName,
            attempt_id: attemptId,
            attempt_timestamp: attemptTimestamp ? new Date(attemptTimestamp) : null,
            score,
            comments,
            status
        });

        res.status(201).json({
            success: true,
            message: 'Evaluación registrada exitosamente',
            data: {
                evaluation: evaluation.toJSON()
            }
        });
    } catch (error) {
        console.error('Error al crear evaluación:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener evaluaciones de un estudiante
router.get('/students/:studentId/evaluations', authenticateToken, requireProfessorOrAdmin, requireStudentAccess, async (req, res) => {
    try {
        const evaluations = await Evaluation.findByStudent(req.params.studentId);
        res.json({
            success: true,
            data: {
                evaluations: evaluations.map(evaluation => evaluation.toJSON())
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

// Obtener listado de evaluaciones del profesor o administrador
router.get('/evaluations', authenticateToken, requireProfessorOrAdmin, async (req, res) => {
    try {
        let evaluations;
        if (req.userData.role === 'admin') {
            evaluations = await Evaluation.findAll();
        } else {
            evaluations = await Evaluation.findByProfessor(req.userData.id);
        }

        res.json({
            success: true,
            data: {
                evaluations: evaluations.map(evaluation => evaluation.toJSON())
            }
        });
    } catch (error) {
        console.error('Error al obtener evaluaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
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
