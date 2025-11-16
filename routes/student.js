const express = require('express');
const Evaluation = require('../models/Evaluation');
const User = require('../models/User');
const { authenticateToken, requireStudent } = require('../middleware/auth');

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

// Obtener intentos/prácticas del estudiante
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
        
        // Por ahora retornar array vacío, las prácticas se obtienen de Firebase
        // Esto se puede expandir para obtener prácticas desde la BD si es necesario
        res.json({
            success: true,
            data: {
                attempts: []
            }
        });
    } catch (error) {
        console.error('Error al obtener intentos del estudiante:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al obtener intentos'
        });
    }
});

module.exports = router;
