// Admin Panel JavaScript
class AdminPanel {
    constructor() {
        this.token = localStorage.getItem('token');
        this.currentUser = null;
        this.users = [];
        this.init();
    }

    async init() {
        if (!this.token) {
            window.location.href = '/login';
            return;
        }

        try {
            await this.loadUserInfo();
            await this.loadDashboardData();
            this.setupEventListeners();
            this.setupNavigation();
            
            // 🔄 AUTO-REFRESH: Actualizar datos cada 5 segundos
            this.startAutoRefresh();
        } catch (error) {
            console.error('Error inicializando panel:', error);
            this.showMessage('Error al cargar el panel de administración', 'error');
        }
    }
    
    startAutoRefresh() {
        // Limpiar interval anterior si existe
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        // Actualizar cada 5 segundos (5000ms)
        this.refreshInterval = setInterval(async () => {
            // Actualización silenciosa (sin mostrar loading)
            await this.loadDashboardData(true); // true = silent
        }, 5000);
        
        console.log('✅ Auto-refresh activado (silencioso): actualizando cada 5 segundos');
    }
    
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
            console.log('⏸️ Auto-refresh detenido');
        }
    }

    async loadUserInfo() {
        try {
            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Token inválido');
            }

            const data = await response.json();
            this.currentUser = data.data.user;
            
            if (this.currentUser.role !== 'admin') {
                this.showMessage('No tienes permisos para acceder a esta página', 'error');
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 2000);
                return;
            }

            document.getElementById('adminName').textContent = this.currentUser.name;
        } catch (error) {
            console.error('Error cargando información del usuario:', error);
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
    }

    async loadDashboardData(silent = false) {
        try {
            // Solo mostrar loading si NO es actualización silenciosa
            if (!silent) {
                this.showLoading(true);
            }
            
            // Cargar usuarios
            await this.loadUsers();
            
            // Cargar actividad reciente
            await this.loadRecentActivity();
            
        } catch (error) {
            console.error('Error cargando datos del dashboard:', error);
            if (!silent) {
                this.showMessage('Error al cargar los datos', 'error');
            }
        } finally {
            if (!silent) {
                this.showLoading(false);
            }
        }
    }

    async loadUsers() {
        try {
            const response = await fetch('/api/roles/all', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) throw new Error('Error cargando usuarios');

            const data = await response.json();
            this.users = data.data.users;

            // Actualizar estadísticas del dashboard
            this.updateDashboardStats();
            
            this.renderUsersTable();
            this.populateUserSelects();
        } catch (error) {
            console.error('Error cargando usuarios:', error);
        }
    }

    updateDashboardStats() {
        if (!this.users) return;
        
        const stats = {
            total: this.users.length,
            admin: this.users.filter(u => u.role === 'admin').length,
            profesor: this.users.filter(u => u.role === 'profesor').length,
            estudiante: this.users.filter(u => u.role === 'estudiante').length,
            padre: this.users.filter(u => u.role === 'padre').length
        };

        // Actualizar UI
        document.getElementById('totalUsers').textContent = stats.total;
        document.getElementById('totalProfessors').textContent = stats.profesor;
        document.getElementById('totalStudents').textContent = stats.estudiante;
        document.getElementById('totalParents').textContent = stats.padre;
    }

    renderUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        this.users.forEach(user => {
            const row = document.createElement('tr');
            
            const parentName = user.parent_id ? 
                this.users.find(u => u.id === user.parent_id)?.name || 'N/A' : 
                'Sin asignar';

            const createdAt = user.created_at ? new Date(user.created_at) : new Date();
            const displayId = user.displayId || user.id;
            const actions = user.source === 'firebase'
                ? `<span class="readonly-note">Solo lectura</span>`
                : `
                    <div class="action-buttons">
                        <button class="btn btn-secondary" onclick="adminPanel.editUser(${user.id})">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        ${user.role !== 'admin' ? `
                            <button class="btn btn-danger" onclick="adminPanel.deleteUser(${user.id})">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        ` : ''}
                    </div>
                `;

            row.innerHTML = `
                <td>${displayId}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span class="role-badge ${user.role}">${user.role}</span></td>
                <td>${parentName}</td>
                <td>${createdAt.toLocaleDateString()}</td>
                <td>${actions}</td>
            `;
            
            tbody.appendChild(row);
        });
    }

    populateUserSelects() {
        const userSelect = document.getElementById('userSelect');
        const parentSelect = document.getElementById('parentSelect');
        
        // Limpiar opciones existentes
        userSelect.innerHTML = '<option value="">Seleccionar usuario...</option>';
        parentSelect.innerHTML = '<option value="">Sin padre asignado</option>';
        
        // Agregar usuarios (solo los gestionados por el backend)
        this.users
            .filter(user => user.source !== 'firebase')
            .forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.name} (${user.email}) - ${user.role}`;
            userSelect.appendChild(option);
        });
        
        // Agregar padres
        const parents = this.users.filter(u => u.role === 'padre' && u.source !== 'firebase');
        parents.forEach(parent => {
            const option = document.createElement('option');
            option.value = parent.id;
            option.textContent = `${parent.name} (${parent.email})`;
            parentSelect.appendChild(option);
        });
    }

    async loadRecentActivity() {
        try {
            // Obtener información de logueos de los usuarios
            const loginInfo = this.users.map(user => {
                const lastLogin = user.last_login ? new Date(user.last_login) : new Date(user.created_at);
                const timeAgo = this.getTimeAgo(lastLogin);
                
                return {
                    icon: 'fas fa-sign-in-alt',
                    title: 'Último acceso',
                    description: `${user.name} (${user.role})`,
                    time: timeAgo,
                    user: user
                };
            }).sort((a, b) => {
                // Ordenar por fecha de último login (más reciente primero)
                const dateA = a.user.last_login ? new Date(a.user.last_login) : new Date(a.user.created_at);
                const dateB = b.user.last_login ? new Date(b.user.last_login) : new Date(b.user.created_at);
                return dateB - dateA;
            }).slice(0, 5); // Mostrar solo los 5 más recientes

            const container = document.getElementById('recentActivityList');
            container.innerHTML = '';

            if (loginInfo.length === 0) {
                container.innerHTML = '<p class="no-activity">No hay información de logueos disponible</p>';
                return;
            }

            loginInfo.forEach(activity => {
                const item = document.createElement('div');
                item.className = 'activity-item';
                item.innerHTML = `
                    <div class="activity-icon">
                        <i class="${activity.icon}"></i>
                    </div>
                    <div class="activity-content">
                        <h4>${activity.title}</h4>
                        <p>${activity.description}</p>
                    </div>
                    <div class="activity-time">${activity.time}</div>
                `;
                container.appendChild(item);
            });
        } catch (error) {
            console.error('Error cargando información de logueos:', error);
            const container = document.getElementById('recentActivityList');
            container.innerHTML = '<p class="no-activity">Error al cargar información de logueos</p>';
        }
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) {
            return 'Hace menos de 1 minuto';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
        } else if (diffInSeconds < 2592000) {
            const days = Math.floor(diffInSeconds / 86400);
            return `Hace ${days} día${days > 1 ? 's' : ''}`;
        } else {
            const months = Math.floor(diffInSeconds / 2592000);
            return `Hace ${months} mes${months > 1 ? 'es' : ''}`;
        }
    }

    setupEventListeners() {
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = '/login';
        });

        // Búsqueda de usuarios
        document.getElementById('userSearch').addEventListener('input', (e) => {
            this.filterUsers(e.target.value);
        });

        // Filtro por rol
        document.getElementById('roleFilter').addEventListener('change', (e) => {
            this.filterUsersByRole(e.target.value);
        });

        // Cambio de rol
        document.getElementById('roleChangeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.changeUserRole();
        });

        // Mostrar/ocultar selector de padre
        document.getElementById('newRole').addEventListener('change', (e) => {
            const parentGroup = document.getElementById('parentSelectGroup');
            if (e.target.value === 'estudiante') {
                parentGroup.style.display = 'block';
            } else {
                parentGroup.style.display = 'none';
            }
        });

        // Event listeners para el modal de edición
        document.getElementById('editUserForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveUserChanges();
        });

        // Mostrar/ocultar selector de padre en el modal
        document.getElementById('editUserRole').addEventListener('change', (e) => {
            const parentGroup = document.getElementById('editParentSelectGroup');
            if (e.target.value === 'estudiante') {
                parentGroup.style.display = 'block';
            } else {
                parentGroup.style.display = 'none';
            }
        });

        // Event listeners para el modal de creación
        document.getElementById('createUserForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveNewUser();
        });

        document.getElementById('createUserRole').addEventListener('change', (e) => {
            const parentGroup = document.getElementById('createParentSelectGroup');
            if (e.target.value === 'estudiante') {
                parentGroup.style.display = 'block';
                this.populateCreateParentSelect();
            } else {
                parentGroup.style.display = 'none';
            }
        });

        // Cerrar modal al hacer clic fuera de él
        document.getElementById('editUserModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('editUserModal')) {
                this.closeEditModal();
            }
        });

        document.getElementById('createUserModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('createUserModal')) {
                this.closeCreateModal();
            }
        });
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
                
                // Agregar clase active al enlace clickeado
                link.classList.add('active');
                
                // Mostrar la sección correspondiente
                const sectionId = link.dataset.section;
                document.getElementById(sectionId).classList.add('active');
                
                // Cargar datos específicos de la sección si es necesario
            });
        });
    }

    filterUsers(searchTerm) {
        const normalizedTerm = searchTerm.toLowerCase();
        const filteredUsers = this.users.filter(user => {
            const name = (user.name || '').toLowerCase();
            const email = (user.email || '').toLowerCase();
            return name.includes(normalizedTerm) || email.includes(normalizedTerm);
        });
        
        this.renderFilteredUsers(filteredUsers);
    }

    filterUsersByRole(role) {
        const filteredUsers = role ? 
            this.users.filter(user => user.role === role) : 
            this.users;
        
        this.renderFilteredUsers(filteredUsers);
    }

    renderFilteredUsers(users) {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        users.forEach(user => {
            const row = document.createElement('tr');
            
            const parentName = user.parent_id ? 
                this.users.find(u => u.id === user.parent_id)?.name || 'N/A' : 
                'Sin asignar';

            const createdAt = user.created_at ? new Date(user.created_at) : new Date();
            const displayId = user.displayId || user.id;
            const actions = user.source === 'firebase'
                ? `<span class="readonly-note">Solo lectura</span>`
                : `
                    <div class="action-buttons">
                        <button class="btn btn-secondary" onclick="adminPanel.editUser(${user.id})">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        ${user.role !== 'admin' ? `
                            <button class="btn btn-danger" onclick="adminPanel.deleteUser(${user.id})">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        ` : ''}
                    </div>
                `;

            row.innerHTML = `
                <td>${displayId}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span class="role-badge ${user.role}">${user.role}</span></td>
                <td>${parentName}</td>
                <td>${createdAt.toLocaleDateString()}</td>
                <td>${actions}</td>
            `;
            
            tbody.appendChild(row);
        });
    }

    async changeUserRole() {
        try {
            const userId = document.getElementById('userSelect').value;
            const newRole = document.getElementById('newRole').value;
            const parentId = document.getElementById('parentSelect').value;

            console.log('Cambiando rol:', { userId, newRole, parentId });

            if (!userId || !newRole) {
                this.showMessage('Por favor completa todos los campos requeridos', 'error');
                return;
            }

            // Validación adicional para estudiantes
            if (newRole === 'estudiante' && !parentId) {
                this.showMessage('Los estudiantes deben tener un padre asignado', 'error');
                return;
            }

            this.showLoading(true);

            // Preparar datos para envío
            const requestData = {
                role: newRole
            };

            // Solo agregar parent_id si tiene un valor válido
            if (parentId && parentId !== '' && parentId !== 'null') {
                requestData.parent_id = parseInt(parentId);
            } else {
                requestData.parent_id = null;
            }

            console.log('Enviando datos:', requestData);

            const response = await fetch(`/api/roles/update/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(requestData)
            });

            const responseData = await response.json();
            console.log('Respuesta del servidor:', responseData);

            if (!response.ok) {
                throw new Error(responseData.message || 'Error al cambiar rol');
            }

            this.showMessage('Rol actualizado exitosamente', 'success');
            
            // Recargar datos
            await this.loadDashboardData();
            
            // Limpiar formulario
            document.getElementById('roleChangeForm').reset();
            document.getElementById('parentSelectGroup').style.display = 'none';

        } catch (error) {
            console.error('Error cambiando rol:', error);
            this.showMessage(error.message || 'Error al cambiar rol', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async editUser(userId) {
        const user = this.users.find(u => u.id == userId);
        if (!user) return;

        if (user.source === 'firebase') {
            this.showMessage('Los usuarios de Firebase son solo lectura desde este panel.', 'error');
            return;
        }

        // Llenar el modal con los datos del usuario
        document.getElementById('editUserId').value = user.id;
        document.getElementById('editUserRole').value = user.role;

        // Manejar el selector de padre
        const parentSelect = document.getElementById('editParentSelect');
        const parentGroup = document.getElementById('editParentSelectGroup');
        
        // Limpiar opciones existentes
        parentSelect.innerHTML = '<option value="">Sin padre asignado</option>';
        
        // Agregar padres disponibles
        const parents = this.users.filter(u => u.role === 'padre' && u.source !== 'firebase');
        parents.forEach(parent => {
            const option = document.createElement('option');
            option.value = parent.id;
            option.textContent = `${parent.name} (${parent.email})`;
            if (user.parent_id && user.parent_id == parent.id) {
                option.selected = true;
            }
            parentSelect.appendChild(option);
        });

        // Mostrar/ocultar selector de padre según el rol
        if (user.role === 'estudiante') {
            parentGroup.style.display = 'block';
        } else {
            parentGroup.style.display = 'none';
        }

        // Mostrar el modal
        document.getElementById('editUserModal').style.display = 'block';
    }

    closeEditModal() {
        document.getElementById('editUserModal').style.display = 'none';
        document.getElementById('editUserForm').reset();
    }

    async saveUserChanges() {
        try {
            const userId = document.getElementById('editUserId').value;
            const role = document.getElementById('editUserRole').value;
            const parentId = document.getElementById('editParentSelect').value;

            console.log('Cambiando rol:', { userId, role, parentId });

            if (!role) {
                this.showMessage('Por favor selecciona un rol', 'error');
                return;
            }

            // Validación adicional para estudiantes
            if (role === 'estudiante' && !parentId) {
                this.showMessage('Los estudiantes deben tener un padre asignado', 'error');
                return;
            }

            this.showLoading(true);

            // Preparar datos para envío - solo rol y parent_id
            const requestData = {
                role: role
            };

            // Solo agregar parent_id si tiene un valor válido
            if (parentId && parentId !== '' && parentId !== 'null') {
                requestData.parent_id = parseInt(parentId);
            } else {
                requestData.parent_id = null;
            }

            console.log('Enviando datos:', requestData);

            const response = await fetch(`/api/roles/update/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(requestData)
            });

            const responseData = await response.json();
            console.log('Respuesta del servidor:', responseData);

            if (!response.ok) {
                throw new Error(responseData.message || 'Error al actualizar rol');
            }

            this.showMessage('Rol actualizado exitosamente', 'success');
            
            // Cerrar modal
            this.closeEditModal();
            
            // Recargar datos
            await this.loadDashboardData();

        } catch (error) {
            console.error('Error actualizando rol:', error);
            this.showMessage(error.message || 'Error al actualizar rol', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async deleteUser(userId) {
        const user = this.users.find(u => u.id == userId);
        if (!user) return;

        if (user.source === 'firebase') {
            this.showMessage('No puedes eliminar usuarios gestionados desde Firebase.', 'error');
            return;
        }

        if (!confirm(`¿Estás seguro de que quieres eliminar a ${user.name}?`)) {
            return;
        }

        try {
            this.showLoading(true);

            const response = await fetch(`/api/roles/delete/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al eliminar usuario');
            }

            this.showMessage('Usuario eliminado exitosamente', 'success');
            await this.loadDashboardData();

        } catch (error) {
            console.error('Error eliminando usuario:', error);
            this.showMessage(error.message || 'Error al eliminar usuario', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
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

    // ===== MODAL FUNCTIONS =====
    
    // Mostrar modal de creación
    showCreateUserModal() {
        // Limpiar formulario
        document.getElementById('createUserForm').reset();
        
        // Ocultar selector de padre inicialmente
        document.getElementById('createParentSelectGroup').style.display = 'none';
        
        // Mostrar modal
        document.getElementById('createUserModal').style.display = 'block';
    }

    // Cerrar modal de creación
    closeCreateModal() {
        document.getElementById('createUserModal').style.display = 'none';
        document.getElementById('createUserForm').reset();
    }

    // Guardar nuevo usuario
    async saveNewUser() {
        try {
            const name = document.getElementById('createUserName').value;
            const email = document.getElementById('createUserEmail').value;
            const password = document.getElementById('createUserPassword').value;
            const role = document.getElementById('createUserRole').value;
            const parentId = document.getElementById('createParentSelect').value;

            if (!name || !email || !password || !role) {
                this.showMessage('Por favor completa todos los campos requeridos', 'error');
                return;
            }

            // Validación adicional para estudiantes
            if (role === 'estudiante' && !parentId) {
                this.showMessage('Los estudiantes deben tener un padre asignado', 'error');
                return;
            }

            const userData = {
                name: name,
                email: email,
                password: password,
                role: role
            };

            // Solo agregar parent_id si tiene un valor válido
            if (parentId && parentId !== '' && parentId !== 'null') {
                userData.parent_id = parseInt(parentId);
            }

            await this.createUserWithRole(userData);
            this.closeCreateModal();

        } catch (error) {
            console.error('Error creando usuario:', error);
            this.showMessage(error.message || 'Error creando usuario', 'error');
        }
    }

    // Poblar selector de padres para creación
    populateCreateParentSelect() {
        const parentSelect = document.getElementById('createParentSelect');
        
        // Limpiar opciones existentes
        parentSelect.innerHTML = '<option value="">Sin padre asignado</option>';
        
        // Agregar padres disponibles
        const parents = this.users.filter(u => u.role === 'padre' && u.source !== 'firebase');
        parents.forEach(parent => {
            const option = document.createElement('option');
            option.value = parent.id;
            option.textContent = `${parent.name} (${parent.email})`;
            parentSelect.appendChild(option);
        });
    }
    
    // CREATE - Crear nuevo usuario con rol
    async createUserWithRole(userData) {
        try {
            this.showLoading(true);
            
            const response = await fetch('/api/roles/create-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(userData)
            });

            const responseData = await response.json();
            
            if (!response.ok) {
                throw new Error(responseData.message || 'Error creando usuario');
            }

            this.showMessage('Usuario creado exitosamente', 'success');
            await this.loadDashboardData();
            
        } catch (error) {
            console.error('Error creando usuario:', error);
            this.showMessage(error.message || 'Error creando usuario', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // READ - Obtener usuarios por rol
    async getUsersByRole(role) {
        try {
            const response = await fetch(`/api/roles/by-role/${role}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) throw new Error('Error obteniendo usuarios por rol');

            const data = await response.json();
            return data.data.users;
        } catch (error) {
            console.error('Error obteniendo usuarios por rol:', error);
            return [];
        }
    }

    // Obtener estadísticas de roles
    async getRoleStats() {
        try {
            const response = await fetch('/api/roles/stats', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) throw new Error('Error obteniendo estadísticas');

            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            return null;
        }
    }
}

// Inicializar el panel cuando se carga la página
let adminPanel;
document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
});
