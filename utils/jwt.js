const jwt = require('jsonwebtoken');

// Configuración JWT
const JWT_CONFIG = {
    secret: process.env.JWT_SECRET || 'fallback_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    algorithm: process.env.JWT_ALGORITHM || 'HS256'
};

// Generar token de acceso
function generateAccessToken(payload) {
    return jwt.sign(payload, JWT_CONFIG.secret, {
        expiresIn: JWT_CONFIG.expiresIn,
        algorithm: JWT_CONFIG.algorithm
    });
}

// Generar token de refresh
function generateRefreshToken(payload) {
    return jwt.sign(payload, JWT_CONFIG.secret, {
        expiresIn: JWT_CONFIG.refreshExpiresIn,
        algorithm: JWT_CONFIG.algorithm
    });
}

// Generar ambos tokens
function generateTokens(payload) {
    return {
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload)
    };
}

// Verificar token
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_CONFIG.secret, {
            algorithms: [JWT_CONFIG.algorithm]
        });
    } catch (error) {
        throw new Error('Token inválido o expirado');
    }
}

// Decodificar token sin verificar (para obtener información)
function decodeToken(token) {
    return jwt.decode(token);
}

// Verificar si el token está próximo a expirar (en los próximos 30 minutos)
function isTokenExpiringSoon(token) {
    try {
        const decoded = jwt.decode(token);
        const now = Math.floor(Date.now() / 1000);
        const expirationTime = decoded.exp;
        const timeUntilExpiry = expirationTime - now;
        
        // Si queda menos de 30 minutos (1800 segundos)
        return timeUntilExpiry < 1800;
    } catch (error) {
        return true; // Si no se puede decodificar, considerar que expira pronto
    }
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    generateTokens,
    verifyToken,
    decodeToken,
    isTokenExpiringSoon,
    JWT_CONFIG
};
