// Panel de Padre - JavaScript
class ParentPanel {
    constructor() {
        this.token = localStorage.getItem('token');
        this.userData = null;
        this.children = [];
        this.practices = [];
        this.charts = {};
        
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
        // Búsqueda de hijos
        document.getElementById('childSearch').addEventListener('input', (e) => {
            this.filterChildren();
        });

        // Filtro de hijos
        document.getElementById('childFilter').addEventListener('change', (e) => {
            this.filterChildren();
        });

        // Filtros de progreso
        document.getElementById('progressChild').addEventListener('change', (e) => {
            this.updateProgressCharts();
        });

        document.getElementById('progressPeriod').addEventListener('change', (e) => {
            this.updateProgressCharts();
        });
    }

    async loadSectionData(section) {
        switch (section) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'children':
                await this.loadChildren();
                break;
            case 'progress':
                await this.loadProgress();
                break;
            case 'profile':
                await this.loadProfile();
                break;
        }
    }

    async loadDashboardData() {
        try {
            this.showLoading(true);
            
            // Simular carga de datos
            await this.loadChildren();
            await this.loadPractices();
            
            // Actualizar estadísticas del dashboard
            this.updateDashboardStats();
            this.renderChildrenOverview();
            
        } catch (error) {
            console.error('Error cargando dashboard:', error);
            this.showMessage('Error cargando datos del dashboard', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async loadChildren() {
        try {
            // Obtener hijos reales de la API
            const response = await fetch('/api/parent/my-children', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error cargando hijos');
            }

            const data = await response.json();
            
            // Mapear datos reales de los hijos
            this.children = data.data.children.map(child => ({
                id: child.id,
                name: child.name,
                email: child.email,
                practices: 0, // Por ahora no hay datos de prácticas
                average: 0, // Por ahora no hay datos de promedio
                lastPractice: child.created_at || new Date().toISOString(),
                progress: 'good', // Valor por defecto
                improvement: '0%' // Valor por defecto
            }));
            
            this.renderChildrenTable();
            this.populateSelectors();
            
        } catch (error) {
            console.error('Error cargando hijos:', error);
            this.showMessage('Error cargando datos de hijos', 'error');
            // Si hay error, mostrar lista vacía
            this.children = [];
            this.renderChildrenTable();
        }
    }

    async loadPractices() {
        try {
            this.practices = [];
            
        } catch (error) {
            console.error('Error cargando prácticas:', error);
            this.showMessage('Error cargando prácticas', 'error');
        }
    }

    async loadProgress() {
        try {
            // Crear gráficos de progreso
            this.createChildrenProgressChart();
            this.createTemporalProgressChart();
            
            // Actualizar resumen de progreso
            this.updateProgressSummary();
            
        } catch (error) {
            console.error('Error cargando progreso:', error);
            this.showMessage('Error cargando datos de progreso', 'error');
        }
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
        const totalChildren = this.children.length;
        const totalPractices = this.practices.length;
        const averageScore = totalPractices > 0 
            ? Math.round(this.practices.reduce((sum, p) => sum + p.score, 0) / totalPractices)
            : 0;
        const lastActivity = this.practices.length > 0 
            ? new Date(Math.max(...this.practices.map(p => new Date(p.date)))).toLocaleDateString('es-ES')
            : 'N/A';
        
        document.getElementById('totalChildren').textContent = totalChildren;
        document.getElementById('totalPractices').textContent = totalPractices;
        document.getElementById('averageScore').textContent = totalPractices > 0 ? `${averageScore}%` : 'N/A';
        document.getElementById('lastActivity').textContent = lastActivity;
    }
    
    getPerformanceStatus(score) {
        if (score >= 90) return 'excellent';
        if (score >= 70) return 'good';
        return 'needs-attention';
    }

    renderChildrenTable() {
        const tbody = document.getElementById('childrenTableBody');
        
        if (!this.children.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data">
                        <i class="fas fa-child"></i>
                        <p>No hay hijos registrados</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = this.children.map(child => `
            <tr>
                <td>
                    <div class="child-info">
                        <strong>${child.name}</strong>
                    </div>
                </td>
                <td>${child.email}</td>
                <td>${child.practices}</td>
                <td>
                    <span class="score-badge score-${child.progress}">
                        ${child.average}%
                    </span>
                </td>
                <td>${new Date(child.lastPractice).toLocaleDateString('es-ES')}</td>
                <td>
                    <span class="progress-indicator progress-${child.progress}">
                        ${child.improvement}
                    </span>
                </td>
                <td>
                    <button onclick="parentPanel.viewChildDetails(${child.id})" class="btn btn-sm btn-primary">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    <button onclick="parentPanel.viewChildProgress(${child.id})" class="btn btn-sm btn-secondary">
                        <i class="fas fa-chart-line"></i> Progreso
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderChildrenOverview() {
        const container = document.getElementById('childrenGrid');
        
        if (!this.children.length) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-child"></i>
                    <p>No hay hijos registrados</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.children.map(child => `
            <div class="child-card">
                <h4>
                    <i class="fas fa-child"></i>
                    ${child.name}
                </h4>
                <p>${child.email}</p>
                <div class="child-stats">
                    <div class="child-stat">
                        <div class="value">${child.practices}</div>
                        <div class="label">Prácticas</div>
                    </div>
                    <div class="child-stat">
                        <div class="value">${child.average}%</div>
                        <div class="label">Promedio</div>
                    </div>
                    <div class="child-stat">
                        <div class="value">${child.improvement}</div>
                        <div class="label">Mejora</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    populateSelectors() {
        // Poblar selectores de progreso
        const progressChildSelect = document.getElementById('progressChild');
        
        // Limpiar opciones existentes
        progressChildSelect.innerHTML = '<option value="">Todos los hijos</option>';
        
        // Agregar hijos
        this.children.forEach(child => {
            const option = document.createElement('option');
            option.value = child.id;
            option.textContent = child.name;
            progressChildSelect.appendChild(option);
        });
    }

    createChildrenProgressChart() {
        const ctx = document.getElementById('childrenProgressChart');
        if (!ctx) return;
        
        // Destruir gráfico existente si existe
        if (this.charts.childrenProgress) {
            this.charts.childrenProgress.destroy();
        }
        
        // Datos de los hijos
        const childrenNames = this.children.map(c => c.name);
        const childrenScores = this.children.map(c => c.average);
        
        this.charts.childrenProgress = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: childrenNames,
                datasets: [{
                    label: 'Puntuación Promedio',
                    data: childrenScores,
                    backgroundColor: 'rgba(142, 68, 173, 0.8)',
                    borderColor: '#8e44ad',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    createTemporalProgressChart() {
        const ctx = document.getElementById('temporalProgressChart');
        if (!ctx) return;
        
        // Destruir gráfico existente si existe
        if (this.charts.temporalProgress) {
            this.charts.temporalProgress.destroy();
        }
        
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
        const averageScores = this.practices.length > 0 ? [0, 0, 0, 0, 0, 0] : [0, 0, 0, 0, 0, 0];
        
        this.charts.temporalProgress = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Promedio Familiar',
                    data: averageScores,
                    borderColor: '#8e44ad',
                    backgroundColor: 'rgba(142, 68, 173, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    updateProgressSummary() {
        document.getElementById('averageImprovement').textContent = '0%';
        document.getElementById('mostActiveDays').textContent = '0';
        document.getElementById('mostPracticedSign').textContent = 'N/A';
    }

    updateProfileStats() {
        const totalChildren = this.children.length;
        const totalPractices = this.practices.length;
        const averageScore = totalPractices > 0 
            ? Math.round(this.practices.reduce((sum, p) => sum + p.score, 0) / totalPractices)
            : 0;
        
        document.getElementById('totalChildrenProfile').textContent = totalChildren;
        document.getElementById('totalPracticesProfile').textContent = totalPractices;
        document.getElementById('averageScoreProfile').textContent = `${averageScore}%`;
    }

    filterChildren() {
        const searchTerm = document.getElementById('childSearch').value.toLowerCase();
        const filterValue = document.getElementById('childFilter').value;
        
        let filteredChildren = this.children;
        
        // Filtrar por búsqueda
        if (searchTerm) {
            filteredChildren = filteredChildren.filter(child => 
                child.name.toLowerCase().includes(searchTerm) ||
                child.email.toLowerCase().includes(searchTerm)
            );
        }
        
        // Filtrar por progreso
        if (filterValue) {
            filteredChildren = filteredChildren.filter(child => {
                switch (filterValue) {
                    case 'excellent':
                        return child.average >= 90;
                    case 'good':
                        return child.average >= 70 && child.average < 90;
                    case 'needs-attention':
                        return child.average < 70;
                    default:
                        return true;
                }
            });
        }
        
        // Renderizar hijos filtrados
        this.renderFilteredChildren(filteredChildren);
    }

    renderFilteredChildren(children) {
        const tbody = document.getElementById('childrenTableBody');
        
        if (!children.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data">
                        <i class="fas fa-search"></i>
                        <p>No se encontraron hijos</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = children.map(child => `
            <tr>
                <td>
                    <div class="child-info">
                        <strong>${child.name}</strong>
                    </div>
                </td>
                <td>${child.email}</td>
                <td>${child.practices}</td>
                <td>
                    <span class="score-badge score-${child.progress}">
                        ${child.average}%
                    </span>
                </td>
                <td>${new Date(child.lastPractice).toLocaleDateString('es-ES')}</td>
                <td>
                    <span class="progress-indicator progress-${child.progress}">
                        ${child.improvement}
                    </span>
                </td>
                <td>
                    <button onclick="parentPanel.viewChildDetails(${child.id})" class="btn btn-sm btn-primary">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    <button onclick="parentPanel.viewChildProgress(${child.id})" class="btn btn-sm btn-secondary">
                        <i class="fas fa-chart-line"></i> Progreso
                    </button>
                </td>
            </tr>
        `).join('');
    }

    updateProgressCharts() {
        // Actualizar gráficos basados en los filtros seleccionados
        this.createChildrenProgressChart();
        this.createTemporalProgressChart();
    }


    // Modal de detalles del hijo
    viewChildDetails(childId) {
        const child = this.children.find(c => c.id === childId);
        if (!child) return;
        
        // Actualizar título del modal
        document.getElementById('childDetailsTitle').textContent = `Detalles de ${child.name}`;
        
        // Crear contenido del modal
        const content = document.getElementById('childDetailsContent');
        content.innerHTML = `
            <div class="child-detail-item">
                <span class="label">Nombre:</span>
                <span class="value">${child.name}</span>
            </div>
            <div class="child-detail-item">
                <span class="label">Email:</span>
                <span class="value">${child.email}</span>
            </div>
            <div class="child-detail-item">
                <span class="label">Prácticas realizadas:</span>
                <span class="value">${child.practices}</span>
            </div>
            <div class="child-detail-item">
                <span class="label">Puntuación promedio:</span>
                <span class="value">${child.average}%</span>
            </div>
            <div class="child-detail-item">
                <span class="label">Última práctica:</span>
                <span class="value">${new Date(child.lastPractice).toLocaleDateString('es-ES')}</span>
            </div>
            <div class="child-detail-item">
                <span class="label">Mejora:</span>
                <span class="value">${child.improvement}</span>
            </div>
        `;
        
        // Mostrar modal
        document.getElementById('childDetailsModal').style.display = 'block';
    }

    closeChildDetailsModal() {
        document.getElementById('childDetailsModal').style.display = 'none';
    }

    viewChildProgress(childId) {
        const child = this.children.find(c => c.id === childId);
        if (!child) return;
        
        this.showMessage(`Viendo progreso de: ${child.name}`, 'success');
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

// Cerrar modal al hacer clic fuera de él
document.addEventListener('click', (e) => {
    const modal = document.getElementById('childDetailsModal');
    if (e.target === modal) {
        parentPanel.closeChildDetailsModal();
    }
});

// Inicializar el panel cuando se carga la página
let parentPanel;
document.addEventListener('DOMContentLoaded', () => {
    parentPanel = new ParentPanel();
});