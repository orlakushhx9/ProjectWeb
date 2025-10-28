// Panel de Estudiante - JavaScript
class StudentPanel {
    constructor() {
        this.token = localStorage.getItem('token');
        this.userData = null;
        this.practices = [];
        
        if (!this.token) {
            window.location.href = '/login';
            return;
        }
        
        this.init();
    }

    async init() {
        try {
            await this.loadUserData();
            this.setupNavigation();
            this.setupEventListeners();
            await this.loadDashboardData();
        } catch (error) {
            console.error('Error inicializando panel:', error);
            this.showMessage('Error cargando datos del usuario', 'error');
        }
    }

    async loadUserData() {
        try {
            const response = await fetch('/api/users/profile', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error cargando datos del usuario');
            }

            const data = await response.json();
            this.userData = data.data.user;
            
            // Actualizar información del usuario en la interfaz
            document.getElementById('userName').textContent = this.userData.name;
            document.getElementById('profileName').textContent = this.userData.name;
            document.getElementById('profileEmail').textContent = this.userData.email;
            
            // Formatear fecha de registro
            const memberSince = new Date(this.userData.created_at).toLocaleDateString('es-ES');
            document.getElementById('memberSince').textContent = memberSince;

        } catch (error) {
            console.error('Error cargando datos del usuario:', error);
            throw error;
        }
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const sections = document.querySelectorAll('.content-section');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remover clase active de todos los enlaces y secciones
                navLinks.forEach(l => l.classList.remove('active'));
                sections.forEach(s => s.classList.remove('active'));
                
                // Agregar clase active al enlace y sección seleccionados
                link.classList.add('active');
                const targetSection = link.getAttribute('data-section');
                document.getElementById(targetSection).classList.add('active');
                
                // Cargar datos específicos de la sección
                this.loadSectionData(targetSection);
            });
        });
    }

    setupEventListeners() {
        // Búsqueda de prácticas
        document.getElementById('practiceSearch').addEventListener('input', (e) => {
            this.filterPractices();
        });

        // Filtro de prácticas
        document.getElementById('practiceFilter').addEventListener('change', (e) => {
            this.filterPractices();
        });
    }

    async loadSectionData(section) {
        switch (section) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'practices':
                await this.loadPractices();
                break;
            case 'profile':
                await this.loadProfile();
                break;
        }
    }

    async loadDashboardData() {
        try {
            this.showLoading(true);
            
            // Simular carga de prácticas (en un sistema real, esto vendría de la API)
            await this.loadPractices();
            
            // Actualizar estadísticas del dashboard
            this.updateDashboardStats();
            
        } catch (error) {
            console.error('Error cargando dashboard:', error);
            this.showMessage('Error cargando datos del dashboard', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async loadPractices() {
        try {
            // Obtener prácticas reales de la API (por ahora estará vacío hasta que se implemente)
            const response = await fetch('/api/student/my-attempts', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                // Si no hay prácticas aún, usar array vacío
                this.practices = [];
            } else {
                const data = await response.json();
                // Mapear datos reales de las prácticas cuando existan
                this.practices = data.data.attempts.map(attempt => ({
                    id: attempt.id,
                    date: attempt.date || attempt.created_at,
                    sign: attempt.sign || 'N/A',
                    score: attempt.score || 0,
                    status: this.getPerformanceStatus(attempt.score || 0)
                }));
            }
            
            this.renderPracticesTable();
            this.renderRecentPractices();
            
        } catch (error) {
            console.error('Error cargando prácticas:', error);
            this.showMessage('Error cargando prácticas', 'error');
            // Si hay error, mostrar lista vacía
            this.practices = [];
            this.renderPracticesTable();
        }
    }
    
    getPerformanceStatus(score) {
        if (score >= 90) return 'excellent';
        if (score >= 70) return 'good';
        if (score >= 50) return 'fair';
        return 'poor';
    }

    async loadProfile() {
        try {
            // Los datos del perfil ya se cargaron en loadUserData
            // Solo actualizamos las estadísticas específicas del perfil
            this.updateProfileStats();
            
        } catch (error) {
            console.error('Error cargando perfil:', error);
            this.showMessage('Error cargando datos del perfil', 'error');
        }
    }

    updateDashboardStats() {
        if (!this.practices.length) return;
        
        const totalPractices = this.practices.length;
        const averageScore = Math.round(this.practices.reduce((sum, p) => sum + p.score, 0) / totalPractices);
        const bestScore = Math.max(...this.practices.map(p => p.score));
        const lastPractice = this.practices[0] ? new Date(this.practices[0].date).toLocaleDateString('es-ES') : 'N/A';
        
        document.getElementById('totalPractices').textContent = totalPractices;
        document.getElementById('averageScore').textContent = `${averageScore}%`;
        document.getElementById('bestScore').textContent = `${bestScore}%`;
        document.getElementById('lastPractice').textContent = lastPractice;
    }

    renderPracticesTable() {
        const tbody = document.getElementById('practicesTableBody');
        
        if (!this.practices.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="no-data">
                        <i class="fas fa-hands"></i>
                        <p>No hay prácticas registradas</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = this.practices.map(practice => `
            <tr>
                <td>${new Date(practice.date).toLocaleDateString('es-ES')}</td>
                <td>${practice.sign}</td>
                <td>
                    <span class="practice-score score-${practice.status}">
                        ${practice.score}%
                    </span>
                </td>
                <td>
                    <span class="status-badge status-${practice.status}">
                        ${this.getStatusText(practice.status)}
                    </span>
                </td>
                <td>
                    <button onclick="studentPanel.viewPractice(${practice.id})" class="btn btn-sm btn-primary">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderRecentPractices() {
        const container = document.getElementById('recentPracticesList');
        const recentPractices = this.practices.slice(0, 3);
        
        if (!recentPractices.length) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-hands"></i>
                    <p>No hay prácticas recientes</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = recentPractices.map(practice => `
            <div class="practice-item">
                <div class="practice-info">
                    <h4>${practice.sign}</h4>
                    <p>${new Date(practice.date).toLocaleDateString('es-ES')}</p>
                </div>
                <div class="practice-score score-${practice.status}">
                    ${practice.score}%
                </div>
            </div>
        `).join('');
    }

    updateProfileStats() {
        if (!this.practices.length) return;
        
        const totalPractices = this.practices.length;
        const averageScore = Math.round(this.practices.reduce((sum, p) => sum + p.score, 0) / totalPractices);
        
        document.getElementById('totalPracticesProfile').textContent = totalPractices;
        document.getElementById('averageScoreProfile').textContent = `${averageScore}%`;
    }

    filterPractices() {
        const searchTerm = document.getElementById('practiceSearch').value.toLowerCase();
        const filterValue = document.getElementById('practiceFilter').value;
        
        let filteredPractices = this.practices;
        
        // Filtrar por búsqueda
        if (searchTerm) {
            filteredPractices = filteredPractices.filter(practice => 
                practice.sign.toLowerCase().includes(searchTerm)
            );
        }
        
        // Filtrar por puntuación
        if (filterValue) {
            filteredPractices = filteredPractices.filter(practice => {
                switch (filterValue) {
                    case 'excellent':
                        return practice.score >= 90;
                    case 'good':
                        return practice.score >= 70 && practice.score < 90;
                    case 'fair':
                        return practice.score >= 50 && practice.score < 70;
                    case 'poor':
                        return practice.score < 50;
                    default:
                        return true;
                }
            });
        }
        
        // Renderizar prácticas filtradas
        this.renderFilteredPractices(filteredPractices);
    }

    renderFilteredPractices(practices) {
        const tbody = document.getElementById('practicesTableBody');
        
        if (!practices.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="no-data">
                        <i class="fas fa-search"></i>
                        <p>No se encontraron prácticas</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = practices.map(practice => `
            <tr>
                <td>${new Date(practice.date).toLocaleDateString('es-ES')}</td>
                <td>${practice.sign}</td>
                <td>
                    <span class="practice-score score-${practice.status}">
                        ${practice.score}%
                    </span>
                </td>
                <td>
                    <span class="status-badge status-${practice.status}">
                        ${this.getStatusText(practice.status)}
                    </span>
                </td>
                <td>
                    <button onclick="studentPanel.viewPractice(${practice.id})" class="btn btn-sm btn-primary">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                </td>
            </tr>
        `).join('');
    }

    getStatusText(status) {
        const statusMap = {
            'excellent': 'Excelente',
            'good': 'Buena',
            'fair': 'Regular',
            'poor': 'Necesita mejorar'
        };
        return statusMap[status] || status;
    }

    viewPractice(practiceId) {
        const practice = this.practices.find(p => p.id === practiceId);
        if (!practice) return;
        
        // En un sistema real, esto abriría un modal o navegaría a una página de detalles
        this.showMessage(`Viendo detalles de la práctica: ${practice.sign}`, 'success');
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.add('show');
        } else {
            overlay.classList.remove('show');
        }
    }

    showMessage(message, type = 'success') {
        const container = document.getElementById('messageContainer');
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.textContent = message;
        
        container.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.remove();
        }, 5000);
    }
}

// Función global para logout
function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
}

// Inicializar el panel cuando se carga la página
let studentPanel;
document.addEventListener('DOMContentLoaded', () => {
    studentPanel = new StudentPanel();
});