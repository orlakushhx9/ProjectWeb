const express = require('express');
const router = express.Router();
const { getAllGestureAttempts, getFirebaseUsers } = require('../services/firebaseAdmin');

// Ruta de prueba para verificar conexión con Firebase
// SOLO PARA DESARROLLO - ELIMINAR EN PRODUCCIÓN
router.get('/test-firebase', async (req, res) => {
    try {
        console.log('[Test Firebase] Iniciando prueba de conexión...');
        
        // Verificar variables de entorno
        const envCheck = {
            FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL ? '✅ Definido' : '❌ NO DEFINIDO',
            FIREBASE_SERVICE_ACCOUNT_JSON: process.env.FIREBASE_SERVICE_ACCOUNT_JSON 
                ? `✅ Definido (${process.env.FIREBASE_SERVICE_ACCOUNT_JSON.length} caracteres)` 
                : '❌ NO DEFINIDO',
            NODE_ENV: process.env.NODE_ENV || 'no definido'
        };
        
        console.log('[Test Firebase] Variables de entorno:', envCheck);
        
        // Intentar obtener usuarios
        let users = [];
        try {
            users = await getFirebaseUsers();
            console.log('[Test Firebase] ✅ Usuarios obtenidos:', users.length);
        } catch (userError) {
            console.error('[Test Firebase] ❌ Error obteniendo usuarios:', userError.message);
        }
        
        // Intentar obtener gestos
        let gestureAttempts = [];
        try {
            gestureAttempts = await getAllGestureAttempts();
            console.log('[Test Firebase] ✅ Gestos obtenidos:', gestureAttempts.length, 'usuarios');
        } catch (gestureError) {
            console.error('[Test Firebase] ❌ Error obteniendo gestos:', gestureError.message);
        }
        
        res.json({
            success: true,
            message: 'Prueba de conexión Firebase completada',
            data: {
                environment: envCheck,
                users: {
                    count: users.length,
                    sample: users.slice(0, 3).map(u => ({ email: u.email, firebase_uid: u.firebase_uid }))
                },
                gestureAttempts: {
                    totalUsers: gestureAttempts.length,
                    sample: gestureAttempts.slice(0, 2).map(g => ({
                        firebase_uid: g.firebase_uid,
                        attemptsCount: g.attempts.length
                    }))
                }
            }
        });
    } catch (error) {
        console.error('[Test Firebase] ❌ Error general:', error);
        res.status(500).json({
            success: false,
            message: 'Error en prueba de Firebase',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

module.exports = router;

