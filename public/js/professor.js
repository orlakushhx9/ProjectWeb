// Panel de Profesor - JavaScript
class ProfessorPanel {
    constructor() {
        this.token = localStorage.getItem('token');
        this.userData = null;
        this.students = [];
        this.evaluations = [];
        this.signs = [];
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
        // Búsqueda de estudiantes
        document.getElementById('studentSearch').addEventListener('input', (e) => {
            this.filterStudents();
        });

        // Filtro de estudiantes
        document.getElementById('studentFilter').addEventListener('change', (e) => {
            this.filterStudents();
        });

        // Búsqueda de evaluaciones
        document.getElementById('evaluationSearch').addEventListener('input', (e) => {
            this.filterEvaluations();
        });

        // Filtro de evaluaciones
        document.getElementById('evaluationFilter').addEventListener('change', (e) => {
            this.filterEvaluations();
        });

        // Búsqueda de gestos
        document.getElementById('signSearch').addEventListener('input', (e) => {
            this.filterSigns();
        });

        // Formulario de evaluación
        document.getElementById('evaluationForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEvaluation();
        });
    }

    async loadSectionData(section) {
        switch (section) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'students':
                await this.loadStudents();
                break;
            case 'evaluations':
                await this.loadEvaluations();
                break;
            case 'signs':
                await this.loadSigns();
                break;
        }
    }

    async loadDashboardData() {
        try {
            this.showLoading(true);
            
            // Simular carga de datos
            await this.loadStudents();
            await this.loadEvaluations();
            
            // Actualizar estadísticas del dashboard
            this.updateDashboardStats();
            this.renderRecentActivity();
            
        } catch (error) {
            console.error('Error cargando dashboard:', error);
            this.showMessage('Error cargando datos del dashboard', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async loadStudents() {
        try {
            // Obtener estudiantes reales de la API
            const response = await fetch('/api/professor/students', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error cargando estudiantes');
            }

            const data = await response.json();
            
            // Mapear datos reales de los estudiantes
            this.students = data.data.students.map(student => ({
                id: student.id,
                name: student.name,
                email: student.email,
                practices: 0, // Por ahora no hay datos de prácticas
                average: 0, // Por ahora no hay datos de promedio
                lastActivity: student.created_at || new Date().toISOString(),
                performance: 'good' // Valor por defecto
            }));
            
            this.renderStudentsTable();
            
        } catch (error) {
            console.error('Error cargando estudiantes:', error);
            this.showMessage('Error cargando estudiantes', 'error');
            // Si hay error, mostrar lista vacía
            this.students = [];
            this.renderStudentsTable();
        }
    }

    async loadEvaluations() {
        try {
            this.evaluations = [];
            this.renderEvaluationsTable();
            
        } catch (error) {
            console.error('Error cargando evaluaciones:', error);
            this.showMessage('Error cargando evaluaciones', 'error');
        }
    }

    async loadSigns() {
        try {
            this.signs = [];
            this.renderSignsGrid();
            
        } catch (error) {
            console.error('Error cargando gestos:', error);
            this.showMessage('Error cargando gestos', 'error');
        }
    }


    updateDashboardStats() {
        const totalStudents = this.students.length;
        const totalEvaluations = this.evaluations.length;
        const completedEvaluations = this.evaluations.filter(e => e.status === 'completed').length;
        const averageScore = completedEvaluations > 0 
            ? Math.round(this.evaluations.filter(e => e.status === 'completed').reduce((sum, e) => sum + e.score, 0) / completedEvaluations)
            : 0;
        const pendingEvaluations = this.evaluations.filter(e => e.status === 'pending').length;
        
        document.getElementById('totalStudents').textContent = totalStudents;
        document.getElementById('totalEvaluations').textContent = totalEvaluations;
        document.getElementById('averageScore').textContent = `${averageScore}%`;
        document.getElementById('pendingEvaluations').textContent = pendingEvaluations;
    }

    renderStudentsTable() {
        const tbody = document.getElementById('studentsTableBody');
        
        if (!this.students.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="no-data">
                        <i class="fas fa-users"></i>
                        <p>No hay estudiantes asignados</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = this.students.map(student => `
            <tr>
                <td>
                    <div class="student-info">
                        <strong>${student.name}</strong>
                    </div>
                </td>
                <td>${student.email}</td>
                <td>${student.practices}</td>
                <td>
                    <span class="score-badge score-${student.performance}">
                        ${student.average}%
                    </span>
                </td>
                <td>${new Date(student.lastActivity).toLocaleDateString('es-ES')}</td>
                <td>
                    <button onclick="professorPanel.viewStudent(${student.id})" class="btn btn-sm btn-primary">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    <button onclick="professorPanel.evaluateStudent(${student.id})" class="btn btn-sm btn-secondary">
                        <i class="fas fa-clipboard-check"></i> Evaluar
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderEvaluationsTable() {
        const tbody = document.getElementById('evaluationsTableBody');
        
        if (!this.evaluations.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="no-data">
                        <i class="fas fa-clipboard-check"></i>
                        <p>No hay evaluaciones registradas</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = this.evaluations.map(evaluation => `
            <tr>
                <td>${evaluation.studentName}</td>
                <td>${evaluation.sign}</td>
                <td>${new Date(evaluation.date).toLocaleDateString('es-ES')}</td>
                <td>
                    <span class="status-badge status-${evaluation.status}">
                        ${this.getStatusText(evaluation.status)}
                    </span>
                </td>
                <td>
                    ${evaluation.score ? `${evaluation.score}%` : 'Pendiente'}
                </td>
                <td>
                    <button onclick="professorPanel.viewEvaluation(${evaluation.id})" class="btn btn-sm btn-primary">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    ${evaluation.status === 'pending' ? `
                        <button onclick="professorPanel.completeEvaluation(${evaluation.id})" class="btn btn-sm btn-secondary">
                            <i class="fas fa-check"></i> Completar
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    }

    renderSignsGrid() {
        const container = document.getElementById('signsGrid');
        
        if (!this.signs.length) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-hands"></i>
                    <p>No hay gestos registrados</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.signs.map(sign => `
            <div class="sign-card">
                <h3>${sign.name}</h3>
                <p>${sign.description}</p>
                <div class="sign-meta">
                    <span class="difficulty difficulty-${sign.difficulty.toLowerCase()}">${sign.difficulty}</span>
                    <span class="category">${sign.category}</span>
                </div>
                <div class="sign-actions">
                    <button onclick="professorPanel.editSign(${sign.id})" class="btn btn-sm btn-primary">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button onclick="professorPanel.deleteSign(${sign.id})" class="btn btn-sm btn-secondary">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderRecentActivity() {
        const container = document.getElementById('recentActivityList');
        const recentEvaluations = this.evaluations.slice(0, 5);
        
        if (!recentEvaluations.length) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-clipboard-check"></i>
                    <p>No hay actividad reciente</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = recentEvaluations.map(evaluation => `
            <div class="activity-item">
                <div class="activity-info">
                    <h4>Evaluación: ${evaluation.sign}</h4>
                    <p>Estudiante: ${evaluation.studentName}</p>
                </div>
                <div class="activity-time">
                    ${new Date(evaluation.date).toLocaleDateString('es-ES')}
                </div>
            </div>
        `).join('');
    }


    filterStudents() {
        const searchTerm = document.getElementById('studentSearch').value.toLowerCase();
        const filterValue = document.getElementById('studentFilter').value;
        
        let filteredStudents = this.students;
        
        // Filtrar por búsqueda
        if (searchTerm) {
            filteredStudents = filteredStudents.filter(student => 
                student.name.toLowerCase().includes(searchTerm) ||
                student.email.toLowerCase().includes(searchTerm)
            );
        }
        
        // Filtrar por rendimiento
        if (filterValue) {
            filteredStudents = filteredStudents.filter(student => {
                switch (filterValue) {
                    case 'excellent':
                        return student.average >= 90;
                    case 'good':
                        return student.average >= 70 && student.average < 90;
                    case 'needs-improvement':
                        return student.average < 70;
                    default:
                        return true;
                }
            });
        }
        
        // Renderizar estudiantes filtrados
        this.renderFilteredStudents(filteredStudents);
    }

    filterEvaluations() {
        const searchTerm = document.getElementById('evaluationSearch').value.toLowerCase();
        const filterValue = document.getElementById('evaluationFilter').value;
        
        let filteredEvaluations = this.evaluations;
        
        // Filtrar por búsqueda
        if (searchTerm) {
            filteredEvaluations = filteredEvaluations.filter(evaluation => 
                evaluation.studentName.toLowerCase().includes(searchTerm) ||
                evaluation.sign.toLowerCase().includes(searchTerm)
            );
        }
        
        // Filtrar por estado
        if (filterValue) {
            filteredEvaluations = filteredEvaluations.filter(evaluation => {
                switch (filterValue) {
                    case 'pending':
                        return evaluation.status === 'pending';
                    case 'completed':
                        return evaluation.status === 'completed';
                    case 'overdue':
                        return evaluation.status === 'pending' && new Date(evaluation.date) < new Date();
                    default:
                        return true;
                }
            });
        }
        
        // Renderizar evaluaciones filtradas
        this.renderFilteredEvaluations(filteredEvaluations);
    }

    filterSigns() {
        const searchTerm = document.getElementById('signSearch').value.toLowerCase();
        
        let filteredSigns = this.signs;
        
        // Filtrar por búsqueda
        if (searchTerm) {
            filteredSigns = filteredSigns.filter(sign => 
                sign.name.toLowerCase().includes(searchTerm) ||
                sign.description.toLowerCase().includes(searchTerm) ||
                sign.category.toLowerCase().includes(searchTerm)
            );
        }
        
        // Renderizar gestos filtrados
        this.renderFilteredSigns(filteredSigns);
    }

    renderFilteredStudents(students) {
        const tbody = document.getElementById('studentsTableBody');
        
        if (!students.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="no-data">
                        <i class="fas fa-search"></i>
                        <p>No se encontraron estudiantes</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = students.map(student => `
            <tr>
                <td>
                    <div class="student-info">
                        <strong>${student.name}</strong>
                    </div>
                </td>
                <td>${student.email}</td>
                <td>${student.practices}</td>
                <td>
                    <span class="score-badge score-${student.performance}">
                        ${student.average}%
                    </span>
                </td>
                <td>${new Date(student.lastActivity).toLocaleDateString('es-ES')}</td>
                <td>
                    <button onclick="professorPanel.viewStudent(${student.id})" class="btn btn-sm btn-primary">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    <button onclick="professorPanel.evaluateStudent(${student.id})" class="btn btn-sm btn-secondary">
                        <i class="fas fa-clipboard-check"></i> Evaluar
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderFilteredEvaluations(evaluations) {
        const tbody = document.getElementById('evaluationsTableBody');
        
        if (!evaluations.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="no-data">
                        <i class="fas fa-search"></i>
                        <p>No se encontraron evaluaciones</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = evaluations.map(evaluation => `
            <tr>
                <td>${evaluation.studentName}</td>
                <td>${evaluation.sign}</td>
                <td>${new Date(evaluation.date).toLocaleDateString('es-ES')}</td>
                <td>
                    <span class="status-badge status-${evaluation.status}">
                        ${this.getStatusText(evaluation.status)}
                    </span>
                </td>
                <td>
                    ${evaluation.score ? `${evaluation.score}%` : 'Pendiente'}
                </td>
                <td>
                    <button onclick="professorPanel.viewEvaluation(${evaluation.id})" class="btn btn-sm btn-primary">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    ${evaluation.status === 'pending' ? `
                        <button onclick="professorPanel.completeEvaluation(${evaluation.id})" class="btn btn-sm btn-secondary">
                            <i class="fas fa-check"></i> Completar
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    }

    renderFilteredSigns(signs) {
        const container = document.getElementById('signsGrid');
        
        if (!signs.length) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-search"></i>
                    <p>No se encontraron gestos</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = signs.map(sign => `
            <div class="sign-card">
                <h3>${sign.name}</h3>
                <p>${sign.description}</p>
                <div class="sign-meta">
                    <span class="difficulty difficulty-${sign.difficulty.toLowerCase()}">${sign.difficulty}</span>
                    <span class="category">${sign.category}</span>
                </div>
                <div class="sign-actions">
                    <button onclick="professorPanel.editSign(${sign.id})" class="btn btn-sm btn-primary">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button onclick="professorPanel.deleteSign(${sign.id})" class="btn btn-sm btn-secondary">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `).join('');
    }

    getStatusText(status) {
        const statusMap = {
            'completed': 'Completada',
            'pending': 'Pendiente',
            'overdue': 'Vencida'
        };
        return statusMap[status] || status;
    }
    
    getPerformanceStatus(score) {
        if (score >= 90) return 'excellent';
        if (score >= 70) return 'good';
        if (score < 70) return 'needs-improvement';
        return 'good'; // Valor por defecto
    }

    // Modal de evaluación
    createEvaluation() {
        // Poblar selectores
        this.populateEvaluationSelectors();
        
        // Mostrar modal
        document.getElementById('evaluationModal').style.display = 'block';
    }

    closeEvaluationModal() {
        document.getElementById('evaluationModal').style.display = 'none';
        document.getElementById('evaluationForm').reset();
    }

    populateEvaluationSelectors() {
        const studentSelect = document.getElementById('evaluationStudent');
        const signSelect = document.getElementById('evaluationSign');
        
        // Limpiar opciones
        studentSelect.innerHTML = '<option value="">Seleccionar estudiante...</option>';
        signSelect.innerHTML = '<option value="">Seleccionar gesto...</option>';
        
        // Agregar estudiantes
        this.students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = student.name;
            studentSelect.appendChild(option);
        });
        
        // Agregar gestos
        this.signs.forEach(sign => {
            const option = document.createElement('option');
            option.value = sign.id;
            option.textContent = sign.name;
            signSelect.appendChild(option);
        });
    }

    async saveEvaluation() {
        try {
            const studentId = document.getElementById('evaluationStudent').value;
            const signId = document.getElementById('evaluationSign').value;
            const date = document.getElementById('evaluationDate').value;
            const notes = document.getElementById('evaluationNotes').value;
            
            if (!studentId || !signId || !date) {
                this.showMessage('Por favor completa todos los campos requeridos', 'error');
                return;
            }
            
            // En un sistema real, esto haría una llamada a la API
            this.showMessage('Evaluación creada exitosamente', 'success');
            this.closeEvaluationModal();
            await this.loadEvaluations();
            
        } catch (error) {
            console.error('Error guardando evaluación:', error);
            this.showMessage('Error guardando evaluación', 'error');
        }
    }

    // Acciones de estudiantes
    viewStudent(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;
        
        this.showMessage(`Viendo detalles de: ${student.name}`, 'success');
    }

    evaluateStudent(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;
        
        this.showMessage(`Iniciando evaluación para: ${student.name}`, 'success');
    }

    // Acciones de evaluaciones
    viewEvaluation(evaluationId) {
        const evaluation = this.evaluations.find(e => e.id === evaluationId);
        if (!evaluation) return;
        
        this.showMessage(`Viendo evaluación: ${evaluation.sign}`, 'success');
    }

    completeEvaluation(evaluationId) {
        const evaluation = this.evaluations.find(e => e.id === evaluationId);
        if (!evaluation) return;
        
        this.showMessage(`Completando evaluación: ${evaluation.sign}`, 'success');
    }

    // Acciones de gestos
    editSign(signId) {
        const sign = this.signs.find(s => s.id === signId);
        if (!sign) return;
        
        this.showMessage(`Editando gesto: ${sign.name}`, 'success');
    }

    deleteSign(signId) {
        const sign = this.signs.find(s => s.id === signId);
        if (!sign) return;
        
        if (confirm(`¿Estás seguro de que quieres eliminar el gesto "${sign.name}"?`)) {
            this.showMessage(`Gesto "${sign.name}" eliminado`, 'success');
        }
    }

    addSign() {
        this.showMessage('Agregando nuevo gesto', 'success');
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
let professorPanel;
document.addEventListener('DOMContentLoaded', () => {
    professorPanel = new ProfessorPanel();
});