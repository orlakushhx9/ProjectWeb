// Configuración de la API
const API_BASE_URL = 'http://localhost:3000/api';

// Verificar autenticación al cargar la página
window.addEventListener('load', () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        // No hay token o usuario, redirigir al login
        window.location.href = '/home.html';
        return;
    }
    
    // Mostrar información del usuario
    try {
        const userData = JSON.parse(user);
        document.getElementById('userName').textContent = userData.name;
        document.getElementById('profileName').textContent = userData.name;
        document.getElementById('profileEmail').textContent = userData.email;
        
        // Formatear fecha de registro
        if (userData.created_at) {
            const date = new Date(userData.created_at);
            document.getElementById('profileDate').textContent = date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    } catch (error) {
        console.error('Error al parsear datos del usuario:', error);
        logout();
    }
    
    // Verificar si el token sigue siendo válido
    verifyToken();
});

// Verificar token con el servidor
async function verifyToken() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (!data.success) {
            // Token inválido, hacer logout
            logout();
        }
    } catch (error) {
        console.error('Error al verificar token:', error);
        // En caso de error de conexión, mantener la sesión local
    }
}

// Cargar perfil del usuario desde el servidor
async function loadUserProfile() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Actualizar información en localStorage
            localStorage.setItem('user', JSON.stringify(data.data.user));
            
            // Actualizar información en la interfaz
            document.getElementById('userName').textContent = data.data.user.name;
            document.getElementById('profileName').textContent = data.data.user.name;
            document.getElementById('profileEmail').textContent = data.data.user.email;
            
            showMessage('Perfil actualizado correctamente', 'success');
        } else {
            showMessage(data.message || 'Error al cargar el perfil', 'error');
        }
    } catch (error) {
        console.error('Error al cargar perfil:', error);
        showMessage('Error de conexión al cargar el perfil', 'error');
    }
}

// Mostrar formulario de cambio de contraseña
function showChangePassword() {
    const newPassword = prompt('Ingresa tu nueva contraseña (mínimo 6 caracteres):');
    
    if (newPassword === null) {
        // Usuario canceló
        return;
    }
    
    if (newPassword.length < 6) {
        showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    // Aquí podrías implementar la lógica para cambiar la contraseña
    // Por ahora solo mostramos un mensaje
    showMessage('Función de cambio de contraseña en desarrollo', 'info');
}

// Función de logout
function logout() {
    // Limpiar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirigir al login
    window.location.href = '/home.html';
}

// Función para mostrar mensajes
function showMessage(message, type = 'info') {
    // Crear elemento de mensaje
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;
    messageElement.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;
    
    // Aplicar estilos según el tipo
    switch (type) {
        case 'success':
            messageElement.style.backgroundColor = '#27ae60';
            break;
        case 'error':
            messageElement.style.backgroundColor = '#e74c3c';
            break;
        case 'info':
        default:
            messageElement.style.backgroundColor = '#3498db';
            break;
    }
    
    // Agregar al DOM
    document.body.appendChild(messageElement);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        messageElement.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 300);
    }, 3000);
}

// Agregar estilos CSS para las animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);

// Verificar token periódicamente (cada 5 minutos)
setInterval(verifyToken, 5 * 60 * 1000);
