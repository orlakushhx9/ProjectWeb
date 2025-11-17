// Configuración de la API - Funciona en desarrollo y producción
(function() {
    // Detectar si estamos en desarrollo o producción
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.port === '5000';
    
    // Configurar URL base de la API
    if (isDevelopment) {
        // Desarrollo local
        window.API_BASE_URL = 'http://localhost:5000/api';
    } else {
        // Producción (Vercel u otro hosting)
        // Usar la misma URL del sitio actual
        const protocol = window.location.protocol;
        const host = window.location.host;
        window.API_BASE_URL = `${protocol}//${host}/api`;
    }
    
    // Exponer configuración global
    window.APP_CONFIG = {
        API_BASE_URL: window.API_BASE_URL,
        isDevelopment: isDevelopment,
        version: '1.0.0'
    };
    
})();

