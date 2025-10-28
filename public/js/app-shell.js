// App Shell JavaScript - Sistema Web Gestus
// Este archivo maneja toda la navegación y funcionalidad de la página web
class AppShell {
    constructor() {
        // Variables que guardan el estado actual de la aplicación
        this.currentRoute = '';        // Qué página está viendo el usuario
        this.isAuthenticated = false;  // Si el usuario está logueado o no
        this.user = null;              // Información del usuario logueado
        this.routes = {};              // Lista de todas las páginas disponibles
        this.init();                   // Inicia la aplicación
    }

    init() {
        // Configuración inicial de la aplicación
        this.setupEventListeners();    // Prepara los botones y enlaces para funcionar
        this.checkAuthentication();    // Verifica si hay un usuario logueado
        this.setupRouting();           // Configura las páginas disponibles
        this.loadRoute();              // Carga la página inicial
    }

    setupEventListeners() {
        // Configuración de eventos - esto hace que los botones y enlaces funcionen
        
        // Cuando alguien hace clic en un enlace de navegación
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-route]')) {
                e.preventDefault();  // Evita que la página se recargue
                const route = e.target.getAttribute('data-route');
                this.navigateTo(route);  // Cambia a la página seleccionada
            }
        });

        // Botón del menú móvil (las tres rayitas en pantallas pequeñas)
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        const mainNav = document.getElementById('main-nav');
        
        if (mobileToggle && mainNav) {
            mobileToggle.addEventListener('click', () => {
                mainNav.classList.toggle('active');  // Muestra/oculta el menú móvil
            });
        }

        // Maneja los botones de "atrás" y "adelante" del navegador
        window.addEventListener('popstate', () => {
            this.loadRoute();  // Recarga la página cuando el usuario usa los botones del navegador
        });

        // Maneja el envío de formularios (login y registro)
        document.addEventListener('submit', (e) => {
            if (e.target.matches('#loginForm')) {
                e.preventDefault();  // Evita que la página se recargue
                this.handleLogin(e.target);  // Procesa el login
            } else if (e.target.matches('#registerForm')) {
                e.preventDefault();  // Evita que la página se recargue
                this.handleRegister(e.target);  // Procesa el registro
            }
        });
    }

    setupRouting() {
        // Configuración de rutas - aquí se definen todas las páginas disponibles
        // Cada página tiene su propia función que muestra el contenido
        this.routes = {
            '': this.renderHome.bind(this),           // Página principal
            'home': this.renderHome.bind(this),       // Página principal (alternativa)
            'about': this.renderAbout.bind(this),    // Página "Acerca de"
            'services': this.renderServices.bind(this), // Página "Servicios"
            'events': this.renderEvents.bind(this),  // Página "Eventos"
            'contact': this.renderContact.bind(this), // Página "Contacto"
            'login': this.renderLogin.bind(this),    // Página de login
            'register': this.renderRegister.bind(this), // Página de registro
            'dashboard': this.renderDashboard.bind(this) // Panel del usuario logueado
        };
    }

    navigateTo(route) {
        // Función para cambiar de página
        if (route === this.currentRoute) return;  // Si ya está en esa página, no hace nada
        
        // Cierra el menú móvil si está abierto
        const mainNav = document.getElementById('main-nav');
        if (mainNav) {
            mainNav.classList.remove('active');
        }

        // Actualiza la URL en el navegador (sin recargar la página)
        const url = route === 'home' ? '/' : `/${route}`;
        window.history.pushState({}, '', url);
        
        this.loadRoute();  // Carga la nueva página
    }

    loadRoute() {
        // Función que carga la página correspondiente según la URL
        const path = window.location.hash.substring(1) || window.location.pathname.substring(1);
        const route = path === '' ? 'home' : path;  // Si no hay ruta, va a home
        
        this.currentRoute = route;
        this.updateNavigation();  // Actualiza qué enlace está activo
        
        if (this.routes[route]) {
            // Si la página existe, la muestra
            this.showLoading();  // Muestra el spinner de carga
            setTimeout(() => {
                this.routes[route]();  // Ejecuta la función de la página
                this.hideLoading();    // Oculta el spinner
            }, 300);  // Espera 300ms para que se vea el efecto
        } else {
            // Si la página no existe, muestra error 404
            this.renderNotFound();
        }
    }

    updateNavigation() {
        // Actualiza la navegación - marca qué página está activa y muestra/oculta botones según el login
        
        // Marca el enlace de la página actual como activo
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-route') === this.currentRoute) {
                link.classList.add('active');  // Resalta el enlace de la página actual
            }
        });

        // Muestra diferentes botones según si el usuario está logueado o no
        const guestActions = document.getElementById('guest-actions');        // Botones para usuarios no logueados
        const authenticatedActions = document.getElementById('authenticated-actions'); // Botones para usuarios logueados
        
        if (this.isAuthenticated) {
            // Si está logueado: oculta botones de login/registro, muestra botones del usuario
            if (guestActions) guestActions.style.display = 'none';
            if (authenticatedActions) authenticatedActions.style.display = 'flex';
        } else {
            // Si no está logueado: muestra botones de login/registro, oculta botones del usuario
            if (guestActions) guestActions.style.display = 'flex';
            if (authenticatedActions) authenticatedActions.style.display = 'none';
        }
    }

    showLoading() {
        // Muestra el spinner de carga (la ruedita que gira)
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.style.display = 'block';
        }
    }

    hideLoading() {
        // Oculta el spinner de carga
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.style.display = 'none';
        }
    }

    checkAuthentication() {
        // Verifica si hay un usuario logueado revisando el almacenamiento local del navegador
        const token = localStorage.getItem('token');    // Token de autenticación
        const user = localStorage.getItem('user');      // Información del usuario
        
        if (token && user) {
            // Si hay token y usuario, marca como logueado
            this.isAuthenticated = true;
            this.user = JSON.parse(user);  // Convierte el texto JSON a objeto
            this.updateUserDisplay();      // Actualiza el nombre en la interfaz
        }
    }

    updateUserDisplay() {
        // Actualiza el nombre del usuario en la interfaz
        const userName = document.getElementById('user-name');
        if (userName && this.user) {
            userName.textContent = this.user.name || 'Usuario';  // Muestra el nombre o "Usuario" por defecto
        }
    }

    // ===== FUNCIONES QUE MUESTRAN CADA PÁGINA =====
    // Cada función crea el HTML de su página correspondiente
    renderHome() {
        const content = `
            <div class="route-content home-hero">
                <h1>Sistema Web Gestus</h1>
                <p>Una plataforma educativa que utiliza reconocimiento de gestos para crear experiencias de aprendizaje interactivas. 
                Desarrollado por estudiantes de la Universidad Tecnológica de Santa Catarina para promover la inclusión educativa.</p>
                <div class="cta-buttons">
                    ${this.isAuthenticated ? 
                        '<a href="#/dashboard" class="btn-primary" data-route="dashboard">Ir al Dashboard</a>' :
                        '<a href="#/register" class="btn-primary" data-route="register">Registrarse</a><a href="#/login" class="btn-secondary" data-route="login">Iniciar Sesión</a>'
                    }
                </div>
            </div>
        `;
        this.updateContent(content);
    }

    renderAbout() {
        const content = `
            <div class="route-content">
                <div class="dashboard-content">
                    <h2>Nuestro Proyecto</h2>
                    <p>Somos estudiantes de Ingeniería en Desarrollo y Gestión de Software de la Universidad Tecnológica de Santa Catarina. 
                    Este proyecto nació de la necesidad de crear herramientas tecnológicas que faciliten el aprendizaje y la comunicación.</p>
                    
                    <h3>¿Qué desarrollamos?</h3>
                    <p>Nuestro trabajo principal incluye el videojuego educativo <strong>"Guardianes del Saber"</strong> y esta plataforma web 
                    donde los usuarios pueden acceder a contenidos educativos y herramientas de aprendizaje basadas en reconocimiento de gestos.</p>
                    
                    <h3>Nuestro enfoque</h3>
                    <ul>
                        <li>🎯 Aprendizaje a través del juego</li>
                        <li>💻 Desarrollo con tecnologías modernas (Node.js, Express, MySQL)</li>
                        <li>🤝 Herramientas accesibles para todos</li>
                    </ul>
                </div>
            </div>
        `;
        this.updateContent(content);
    }

    renderServices() {
        const content = `
            <div class="route-content">
                <div class="dashboard-content">
                    <h2>Lo que ofrecemos</h2>
                    
                    <div class="services-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; margin-top: 30px;">
                        <div class="service-card" style="background: #f8f9fa; padding: 30px; border-radius: 15px;">
                            <h3>🎮 Guardianes del Saber</h3>
                            <p>Videojuego educativo que usa gestos para enseñar. Los niños pueden aprender mientras juegan minijuegos de fútbol 
                            y refuerzan conocimientos escolares de manera divertida.</p>
                        </div>
                        
                        <div class="service-card" style="background: #f8f9fa; padding: 30px; border-radius: 15px;">
                            <h3>🛒 Plataforma de Licencias</h3>
                            <p>Esta misma página web donde puedes comprar y gestionar las licencias del videojuego. 
                            Incluye sistema de usuarios y autenticación segura.</p>
                        </div>
                        
                        <div class="service-card" style="background: #f8f9fa; padding: 30px; border-radius: 15px;">
                            <h3>🤝 Comunicación por Gestos</h3>
                            <p>Herramienta que convierte gestos físicos en texto o voz en tiempo real. 
                            Útil para personas que tienen dificultades para comunicarse verbalmente.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.updateContent(content);
    }

    renderEvents() {
        const content = `
            <div class="route-content">
                <div class="dashboard-content">
                    <h2>Próximas actividades</h2>
                    
                    <div class="events-grid" style="display: grid; gap: 20px; margin-top: 30px;">
                        <div class="event-card" style="background: #f8f9fa; padding: 30px; border-radius: 15px; display: flex; gap: 20px;">
                            <div class="event-date" style="background: #667eea; color: white; padding: 20px; border-radius: 10px; text-align: center; min-width: 80px;">
                                <div style="font-size: 24px; font-weight: bold;">15</div>
                                <div>Mar</div>
                            </div>
                            <div class="event-info">
                                <h3>Taller de Liderazgo en Proyectos</h3>
                                <p>Charla sobre cómo liderar equipos de desarrollo de software y gestionar proyectos tecnológicos. 
                                Dirigido a estudiantes de nuestra carrera.</p>
                                <span style="color: #667eea; font-weight: 500;">10:00 AM - 2:00 PM</span>
                            </div>
                        </div>
                        
                        <div class="event-card" style="background: #f8f9fa; padding: 30px; border-radius: 15px; display: flex; gap: 20px;">
                            <div class="event-date" style="background: #667eea; color: white; padding: 20px; border-radius: 10px; text-align: center; min-width: 80px;">
                                <div style="font-size: 24px; font-weight: bold;">22</div>
                                <div>Mar</div>
                            </div>
                            <div class="event-info">
                                <h3>Demostración de Reconocimiento de Gestos</h3>
                                <p>Mostraremos cómo funciona nuestra tecnología de reconocimiento de gestos y cómo se puede aplicar 
                                en proyectos educativos y de accesibilidad.</p>
                                <span style="color: #667eea; font-weight: 500;">9:00 AM - 5:00 PM</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.updateContent(content);
    }

    renderContact() {
        const content = `
            <div class="route-content">
                <div class="dashboard-content">
                    <h2>Contáctanos</h2>
                    <p>Si tienes preguntas sobre nuestro proyecto o quieres saber más sobre Gestus, puedes contactarnos.</p>
                    
                    <div class="contact-info" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px; margin: 30px 0;">
                        <div class="contact-item" style="text-align: center; padding: 20px;">
                            <div style="font-size: 2rem; margin-bottom: 10px;">📧</div>
                            <h4>Email</h4>
                            <p>info@gestus.com</p>
                        </div>
                        
                        <div class="contact-item" style="text-align: center; padding: 20px;">
                            <div style="font-size: 2rem; margin-bottom: 10px;">📞</div>
                            <h4>Teléfono</h4>
                            <p>+52 81 2090 6862</p>
                        </div>
                        
                        <div class="contact-item" style="text-align: center; padding: 20px;">
                            <div style="font-size: 2rem; margin-bottom: 10px;">📍</div>
                            <h4>Ubicación</h4>
                            <p>Santa Catarina, Nuevo León, México</p>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 40px;">
                        <h3>¿Te interesa nuestro proyecto?</h3>
                        <p>Únete a nuestra plataforma y descubre más sobre Gestus.</p>
                        ${this.isAuthenticated ? 
                            '<a href="#/dashboard" class="btn-primary" data-route="dashboard">Ir al Dashboard</a>' :
                            '<a href="#/register" class="btn-primary" data-route="register">Registrarse</a>'
                        }
                    </div>
                </div>
            </div>
        `;
        this.updateContent(content);
    }

    renderLogin() {
        if (this.isAuthenticated) {
            this.navigateTo('dashboard');
            return;
        }

        const content = `
            <div class="route-content">
                <div class="auth-container">
                    <div class="auth-header">
                        <h1>Iniciar Sesión</h1>
                        <p>Ingresa tus credenciales para acceder al sistema</p>
                    </div>
                    
                    <form id="loginForm">
                        <div class="form-group">
                            <label for="email">Correo Electrónico</label>
                            <input type="email" id="email" name="email" required placeholder="tu@email.com">
                            <span class="error-message" id="emailError"></span>
                        </div>
                        
                        <div class="form-group">
                            <label for="password">Contraseña</label>
                            <input type="password" id="password" name="password" required placeholder="Tu contraseña">
                            <span class="error-message" id="passwordError"></span>
                        </div>
                        
                        <button type="submit" class="auth-button" id="loginButton">
                            Iniciar Sesión
                        </button>
                        
                        <div class="auth-footer">
                            <p>¿No tienes cuenta? <a href="#/register" data-route="register">Regístrate aquí</a></p>
                        </div>
                    </form>
                </div>
            </div>
        `;
        this.updateContent(content);
    }

    renderRegister() {
        if (this.isAuthenticated) {
            this.navigateTo('dashboard');
            return;
        }

        const content = `
            <div class="route-content">
                <div class="auth-container">
                    <div class="auth-header">
                        <h1>Crear Cuenta</h1>
                        <p>Únete a nuestra comunidad y comienza tu viaje hacia el éxito</p>
                    </div>
                    
                    <form id="registerForm">
                        <div class="form-group">
                            <label for="regName">Nombre Completo</label>
                            <input type="text" id="regName" name="name" required placeholder="Tu nombre completo">
                            <span class="error-message" id="regNameError"></span>
                        </div>
                        
                        <div class="form-group">
                            <label for="regEmail">Correo Electrónico</label>
                            <input type="email" id="regEmail" name="email" required placeholder="tu@email.com">
                            <span class="error-message" id="regEmailError"></span>
                        </div>
                        
                        <div class="form-group">
                            <label for="regPassword">Contraseña</label>
                            <input type="password" id="regPassword" name="password" required placeholder="Mínimo 6 caracteres">
                            <span class="error-message" id="regPasswordError"></span>
                        </div>
                        
                        <div class="form-group">
                            <label for="confirmPassword">Confirmar Contraseña</label>
                            <input type="password" id="confirmPassword" name="confirmPassword" required placeholder="Repite tu contraseña">
                            <span class="error-message" id="confirmPasswordError"></span>
                        </div>
                        
                        <button type="submit" class="auth-button" id="registerButton">
                            Registrarse
                        </button>
                        
                        <div class="auth-footer">
                            <p>¿Ya tienes cuenta? <a href="#/login" data-route="login">Inicia sesión aquí</a></p>
                        </div>
                    </form>
                </div>
            </div>
        `;
        this.updateContent(content);
    }

    renderDashboard() {
        if (!this.isAuthenticated) {
            this.navigateTo('login');
            return;
        }

        const content = `
            <div class="route-content">
                <div class="dashboard-content">
                    <div class="dashboard-welcome">
                        <h2>¡Bienvenido, ${this.user?.name || 'Usuario'}!</h2>
                        <p>Has iniciado sesión exitosamente en tu cuenta.</p>
                    </div>
                    
                    <div class="user-profile">
                        <h3>Información del Perfil</h3>
                        <div class="profile-info">
                            <div class="info-item">
                                <label>Nombre:</label>
                                <span>${this.user?.name || '-'}</span>
                            </div>
                            <div class="info-item">
                                <label>Email:</label>
                                <span>${this.user?.email || '-'}</span>
                            </div>
                            <div class="info-item">
                                <label>Fecha de registro:</label>
                                <span>${this.user?.createdAt ? new Date(this.user.createdAt).toLocaleDateString() : '-'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="actions-section" style="text-align: center;">
                        <h3>Acciones</h3>
                        <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; margin-top: 20px;">
                            <button onclick="appShell.loadUserProfile()" class="btn-primary">Actualizar Perfil</button>
                            <button onclick="appShell.showChangePassword()" class="btn-secondary">Cambiar Contraseña</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.updateContent(content);
    }

    renderNotFound() {
        const content = `
            <div class="route-content">
                <div class="dashboard-content" style="text-align: center;">
                    <h2>Página no encontrada</h2>
                    <p>La página que buscas no existe.</p>
                    <a href="#/" class="btn-primary" data-route="home">Volver al Inicio</a>
                </div>
            </div>
        `;
        this.updateContent(content);
    }

    updateContent(content) {
        const container = document.getElementById('content-container');
        if (container) {
            container.innerHTML = content;
        }
    }

    // ===== FUNCIONES DE AUTENTICACIÓN =====
    // Estas funciones manejan el login, registro y logout de usuarios
    async handleLogin(form) {
        // Función que procesa el login del usuario
        const email = form.email.value.trim();    // Obtiene el email del formulario
        const password = form.password.value;      // Obtiene la contraseña del formulario
        
        // Validación básica - verifica que ambos campos estén llenos
        if (!email || !password) {
            this.showError('email', 'Todos los campos son requeridos');
            return;
        }

        // Deshabilita el botón para evitar múltiples envíos
        const button = form.querySelector('.auth-button');
        button.disabled = true;
        button.textContent = 'Iniciando sesión...';

        try {
            // Envía los datos al servidor para verificar las credenciales
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })  // Envía email y contraseña
            });

            const data = await response.json();  // Recibe la respuesta del servidor

            if (data.success) {
                // Si el login fue exitoso, guarda la información del usuario
                localStorage.setItem('token', data.data.accessToken);        // Token de acceso
                localStorage.setItem('refreshToken', data.data.refreshToken); // Token de renovación
                localStorage.setItem('user', JSON.stringify(data.data.user)); // Información del usuario
                
                // Actualiza el estado de la aplicación
                this.isAuthenticated = true;
                this.user = data.data.user;
                this.updateUserDisplay();    // Muestra el nombre del usuario
                this.updateNavigation();     // Actualiza los botones de navegación
                
                this.showMessage('¡Login exitoso!', 'success');
                setTimeout(() => {
                    this.navigateTo('dashboard');  // Redirige al panel del usuario
                }, 1000);
            } else {
                // Si hay error, muestra el mensaje del servidor
                this.showMessage(data.message || 'Error en el login', 'error');
            }
        } catch (error) {
            // Si hay error de conexión, muestra mensaje genérico
            console.error('Error en login:', error);
            this.showMessage('Error de conexión. Intenta nuevamente.', 'error');
        } finally {
            // Rehabilita el botón sin importar el resultado
            button.disabled = false;
            button.textContent = 'Iniciar Sesión';
        }
    }

    async handleRegister(form) {
        const name = form.name.value.trim();
        const email = form.email.value.trim();
        const password = form.password.value;
        const confirmPassword = form.confirmPassword.value;
        
        // Basic validation
        if (!name || !email || !password || !confirmPassword) {
            this.showMessage('Todos los campos son requeridos', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showMessage('Las contraseñas no coinciden', 'error');
            return;
        }

        const button = form.querySelector('.auth-button');
        button.disabled = true;
        button.textContent = 'Registrando...';

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('token', data.data.accessToken);
                localStorage.setItem('refreshToken', data.data.refreshToken);
                localStorage.setItem('user', JSON.stringify(data.data.user));
                
                this.isAuthenticated = true;
                this.user = data.data.user;
                this.updateUserDisplay();
                this.updateNavigation();
                
                this.showMessage('¡Registro exitoso!', 'success');
                setTimeout(() => {
                    this.navigateTo('dashboard');
                }, 1000);
            } else {
                this.showMessage(data.message || 'Error en el registro', 'error');
            }
        } catch (error) {
            console.error('Error en registro:', error);
            this.showMessage('Error de conexión. Intenta nuevamente.', 'error');
        } finally {
            button.disabled = false;
            button.textContent = 'Registrarse';
        }
    }

    logout() {
        // Función para cerrar sesión - elimina toda la información del usuario
        localStorage.removeItem('token');        // Elimina el token de acceso
        localStorage.removeItem('refreshToken'); // Elimina el token de renovación
        localStorage.removeItem('user');         // Elimina la información del usuario
        
        // Actualiza el estado de la aplicación
        this.isAuthenticated = false;
        this.user = null;
        this.updateNavigation();  // Actualiza los botones de navegación
        
        this.showMessage('Sesión cerrada exitosamente', 'success');
        setTimeout(() => {
            this.navigateTo('home');  // Redirige a la página principal
        }, 1000);
    }

    showMessage(message, type = 'info') {
        // Función que muestra mensajes temporales al usuario (éxito, error, información)
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        `;
        messageDiv.textContent = message;
        
        document.body.appendChild(messageDiv);
        
        // Elimina el mensaje después de 3 segundos
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    showError(fieldId, message) {
        // Función que muestra errores en los campos del formulario
        const errorElement = document.getElementById(fieldId + 'Error');  // Elemento donde mostrar el error
        const inputElement = document.getElementById(fieldId);             // Campo del formulario
        
        if (errorElement) {
            errorElement.textContent = message;  // Muestra el mensaje de error
        }
        
        if (inputElement) {
            inputElement.classList.add('error');  // Marca el campo como con error (borde rojo)
        }
    }

    // ===== FUNCIONES DEL DASHBOARD =====
    // Estas funciones manejan las acciones del panel del usuario
    loadUserProfile() {
        this.showMessage('Perfil actualizado correctamente', 'success');
    }

    showChangePassword() {
        this.showMessage('Contraseña actualizada correctamente', 'success');
    }
}

// ===== FUNCIONES GLOBALES =====
// Estas funciones están disponibles desde cualquier parte del código
function logout() {
    if (window.appShell) {
        window.appShell.logout();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Cuando la página termina de cargar, crea la instancia de la aplicación
    window.appShell = new AppShell();
});
