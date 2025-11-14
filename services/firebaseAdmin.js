const admin = require('firebase-admin');

let firebaseInitialized = false;

function initializeFirebaseAdmin() {
    if (firebaseInitialized) {
        return;
    }

    const databaseURL = process.env.FIREBASE_DATABASE_URL;
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    console.log('[Firebase Admin] Iniciando inicialización...');
    console.log('[Firebase Admin] FIREBASE_DATABASE_URL:', databaseURL ? 'Definido' : 'NO DEFINIDO');
    console.log('[Firebase Admin] FIREBASE_SERVICE_ACCOUNT_JSON:', serviceAccountJson ? 'Definido (' + serviceAccountJson.length + ' caracteres)' : 'NO DEFINIDO');
    console.log('[Firebase Admin] NODE_ENV:', process.env.NODE_ENV);

    if (!databaseURL) {
        const error = new Error('FIREBASE_DATABASE_URL no está definido en las variables de entorno.');
        console.error('[Firebase Admin] Error:', error.message);
        throw error;
    }

    let credential;

    if (serviceAccountJson) {
        try {
            const parsed = JSON.parse(serviceAccountJson);
            credential = admin.credential.cert(parsed);
            console.log('[Firebase Admin] ✅ Inicializado usando FIREBASE_SERVICE_ACCOUNT_JSON');
        } catch (error) {
            const err = new Error('FIREBASE_SERVICE_ACCOUNT_JSON no contiene un JSON válido: ' + error.message);
            console.error('[Firebase Admin] Error parseando JSON:', err.message);
            console.error('[Firebase Admin] JSON recibido (primeros 100 caracteres):', serviceAccountJson.substring(0, 100));
            throw err;
        }
    } else if (serviceAccountPath && process.env.NODE_ENV !== 'production') {
        // Solo permitir PATH en desarrollo, no en producción
        try {
            // eslint-disable-next-line global-require, import/no-dynamic-require
            const serviceAccount = require(serviceAccountPath);
            credential = admin.credential.cert(serviceAccount);
            console.log('[Firebase Admin] ✅ Inicializado usando FIREBASE_SERVICE_ACCOUNT_PATH (solo desarrollo)');
        } catch (error) {
            const err = new Error(`No se pudo cargar el archivo de credenciales en FIREBASE_SERVICE_ACCOUNT_PATH (${serviceAccountPath}): ${error.message}`);
            console.error('[Firebase Admin] Error:', err.message);
            throw err;
        }
    } else {
        const error = new Error('Debes definir FIREBASE_SERVICE_ACCOUNT_JSON en las variables de entorno. FIREBASE_SERVICE_ACCOUNT_PATH solo está disponible en desarrollo.');
        console.error('[Firebase Admin] Error:', error.message);
        throw error;
    }

    try {
        admin.initializeApp({
            credential,
            databaseURL
        });
        firebaseInitialized = true;
        console.log('[Firebase Admin] ✅ Firebase Admin inicializado correctamente');
    } catch (error) {
        console.error('[Firebase Admin] Error al inicializar Firebase Admin:', error.message);
        throw error;
    }
}

async function getFirebaseUsers(existingEmails = new Set()) {
    initializeFirebaseAdmin();

    const snapshot = await admin.database().ref('users').once('value');
    const usersData = snapshot.val() || {};
    const firebaseUsers = [];

    Object.entries(usersData).forEach(([uid, userData]) => {
        if (!userData) return;

        const email = typeof userData.email === 'string' ? userData.email.trim() : '';
        if (!email || existingEmails.has(email.toLowerCase())) {
            return;
        }

        const name =
            userData.displayName ||
            userData.fullName ||
            userData.name ||
            'Usuario Firebase';

        const createdAtSource =
            userData.createdAt ||
            userData.created_at ||
            userData.created_at_ms ||
            Date.now();

        const createdAt = new Date(createdAtSource);

        // Intentar obtener la contraseña de Firebase
        // Si existe un campo password, usarlo; si no, usar una contraseña por defecto
        // Nota: Firebase puede tener passwordHash (SHA-256) que no es compatible con bcrypt
        const password = userData.password || userData.pass || null;
        const passwordHash = userData.passwordHash || null;
        const pinHash = userData.pinHash || null;

        firebaseUsers.push({
            id: `fb-${uid}`,
            displayId: `FB-${uid.slice(-6).toUpperCase()}`,
            firebase_uid: uid,
            name,
            email,
            password, // Contraseña en texto plano o bcrypt (si existe)
            passwordHash, // Hash SHA-256 de Firebase (no compatible con bcrypt)
            pinHash, // Hash del PIN (no compatible con bcrypt)
            role: 'estudiante',
            parent_id: userData.parent_id || null,
            created_at: createdAt.toISOString(),
            last_login: userData.lastLoginAt || userData.last_login || null,
            source: 'firebase',
            raw: userData
        });
    });

    return firebaseUsers;
}

function normalizeGestureAttempts(rawAttempts = {}) {
    const attempts = [];

    const pushAttempt = (gestureId, attemptId, payload = {}) => {
        if (!payload) return;

        const timestamp =
            payload.timestamp ||
            payload.performedAt ||
            payload.createdAt ||
            payload.date ||
            Date.now();

        let score = payload.percentage ?? payload.score ?? payload.confidence ?? 0;
        if (typeof score === 'string') {
            const parsed = Number(score);
            score = Number.isNaN(parsed) ? 0 : parsed;
        }
        if (typeof score === 'number' && score <= 1) {
            score = Math.round(score * 100);
        }
        score = Math.max(0, Math.min(100, Math.round(score)));

        const signName =
            payload.sign ||
            payload.signName ||
            payload.gestureName ||
            payload.name ||
            gestureId ||
            'Gesto';

        attempts.push({
            id: `${gestureId}::${attemptId}`,
            gestureId,
            sign: signName,
            percentage: score,
            timestamp,
            raw: payload
        });
    };

    Object.entries(rawAttempts).forEach(([gestureId, gesturePayload]) => {
        if (!gesturePayload) return;

        if (Array.isArray(gesturePayload)) {
            gesturePayload.forEach((attempt, index) => {
                pushAttempt(gestureId, index, attempt);
            });
            return;
        }

        const { attempts: nestedAttempts, ...rest } = gesturePayload;

        if (Array.isArray(nestedAttempts)) {
            nestedAttempts.forEach((attempt, index) => {
                pushAttempt(gestureId, index, { ...rest, ...attempt });
            });
            return;
        }

        if (nestedAttempts && typeof nestedAttempts === 'object') {
            Object.entries(nestedAttempts).forEach(([attemptId, attempt]) => {
                pushAttempt(gestureId, attemptId, { ...rest, ...attempt });
            });
            return;
        }

        if (typeof gesturePayload === 'object') {
            pushAttempt(gestureId, 'default', gesturePayload);
        }
    });

    attempts.sort((a, b) => b.timestamp - a.timestamp);
    return attempts;
}

async function getGestureAttemptsForUser(firebaseUid) {
    initializeFirebaseAdmin();

    if (!firebaseUid) {
        return {
            summary: {
                totalAttempts: 0,
                averageScore: 0,
                lastPractice: null,
                bestScore: 0,
                progressPercent: 0
            },
            attempts: []
        };
    }

    const snapshot = await admin.database().ref(`gestureAttempts/${firebaseUid}`).once('value');
    const raw = snapshot.val() || {};
    const attempts = normalizeGestureAttempts(raw);

    const totalAttempts = attempts.length;
    const averageScore = totalAttempts
        ? Math.round(attempts.reduce((sum, attempt) => sum + (attempt.percentage || 0), 0) / totalAttempts)
        : 0;
    const bestScore = totalAttempts
        ? Math.max(...attempts.map(attempt => attempt.percentage || 0))
        : 0;
    const lastPractice = totalAttempts ? new Date(attempts[0].timestamp).toISOString() : null;

    return {
        summary: {
            totalAttempts,
            averageScore,
            lastPractice,
            bestScore,
            progressPercent: averageScore
        },
        attempts
    };
}


async function getAllGestureAttempts() {
    initializeFirebaseAdmin();

    const snapshot = await admin.database().ref('gestureAttempts').once('value');
    const data = snapshot.val() || {};

    return Object.entries(data).map(([firebaseUid, attempts]) => ({
        firebase_uid: firebaseUid,
        attempts: normalizeGestureAttempts(attempts)
    }));
}

module.exports = {
    getFirebaseUsers,
    getGestureAttemptsForUser,
    getAllGestureAttempts
};

