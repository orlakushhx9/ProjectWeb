// Panel de Estudiante - JavaScript
class StudentPanel {
    constructor() {
        this.token = localStorage.getItem('token');
        this.userData = null;
        this.practices = [];
        this.evaluations = []; // Evaluaciones del profesor
        
        if (!this.token) {
            window.location.href = '/login';
            return;
        }
        
        this.init();
    }

    async init() {
        try {
            console.log('[Student] ===== INICIALIZANDO PANEL =====');
            await this.loadUserData();
            
            // Ya no usamos Firebase, todo viene de Railway
            this.setupNavigation();
            this.setupEventListeners();
            await this.loadDashboardData();
            
            // 🔄 AUTO-REFRESH: Actualizar datos cada 5 segundos
            this.startAutoRefresh();
            console.log('[Student] ===== PANEL INICIALIZADO =====');
        } catch (error) {
            console.error('[Student] ❌ Error inicializando panel:', error);
            console.error('[Student] Stack:', error.stack);
            this.showMessage('Error cargando datos del usuario', 'error');
        }
    }
    
    startAutoRefresh() {
        // Limpiar interval anterior si existe
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        // Actualizar cada 5 segundos
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
                // Cargar prácticas de Railway y Firebase
                await this.loadPractices();
                await this.loadFirebasePractices();
                // Combinar con evaluaciones si existen
                if (this.evaluations && this.evaluations.length > 0) {
                    this.combinePracticesAndEvaluations();
                }
                // Renderizar tabla de prácticas
                this.renderPracticesTable();
                break;
            case 'profile':
                await this.loadProfile();
                break;
        }
    }

    async loadDashboardData(silent = false) {
        try {
            console.log('[Student] ===== loadDashboardData iniciado =====');
            // Solo mostrar loading si NO es actualización silenciosa
            if (!silent) {
                this.showLoading(true);
            }
            
            // Paso 1: Cargar evaluaciones del profesor desde Railway
            console.log('[Student] Paso 1: Cargando evaluaciones desde Railway...');
            await this.loadEvaluations();
            console.log('[Student] Paso 1 completado. Evaluaciones:', this.evaluations.length);
            
            // Paso 2: Cargar prácticas desde Railway (tabla gesture_attempts)
            console.log('[Student] Paso 2: Cargando prácticas desde Railway...');
            await this.loadPractices();
            console.log('[Student] Paso 2 completado. Prácticas:', this.practices.length);
            
            // Paso 2.5: Cargar prácticas desde Firebase
            console.log('[Student] Paso 2.5: Cargando prácticas desde Firebase...');
            await this.loadFirebasePractices();
            console.log('[Student] Paso 2.5 completado. Prácticas de Firebase cargadas');
            
            // Paso 3: Combinar evaluaciones con prácticas
            console.log('[Student] Paso 3: Combinando prácticas y evaluaciones...');
            this.combinePracticesAndEvaluations();
            console.log('[Student] Paso 3 completado. Total prácticas combinadas:', this.practices.length);
            
            // Paso 4: Actualizar estadísticas del dashboard (final)
            console.log('[Student] Paso 4: Actualizando estadísticas finales...');
            this.updateDashboardStats();
            
            // Paso 5: Renderizar datos
            console.log('[Student] Paso 5: Renderizando datos...');
            this.renderPracticesTable();
            this.renderRecentPractices();
            this.updateProfileStats();
            
            console.log('[Student] ===== loadDashboardData completado =====');
            
        } catch (error) {
            console.error('[Student] ❌ Error cargando dashboard:', error);
            console.error('[Student] Stack:', error.stack);
            if (!silent) {
                this.showMessage('Error cargando datos del dashboard', 'error');
            }
        } finally {
            if (!silent) {
                this.showLoading(false);
            }
        }
    }
    
    combinePracticesAndEvaluations() {
        console.log('[Student] Combinando prácticas y evaluaciones...');
        
        // Convertir TODAS las evaluaciones del profesor a formato de práctica
        const evaluatedPractices = (this.evaluations || []).map(evaluation => {
            // Obtener el nombre del gesto desde diferentes campos posibles
            const gestureName = evaluation.gestureName || 
                               evaluation.gesture_name || 
                               evaluation.sign || 
                               evaluation.gestureId || 
                               'Gesto desconocido';
            
            return {
                id: `eval-${evaluation.id}`,
                date: evaluation.attemptTimestamp || evaluation.attempt_timestamp || evaluation.created_at || evaluation.updated_at || new Date().toISOString(),
                sign: gestureName,
                score: evaluation.score || 0,
                status: this.getPerformanceStatus(evaluation.score || 0),
                type: 'evaluated', // Marcar como evaluada
                evaluation: evaluation, // Guardar datos completos de la evaluación
                comments: evaluation.comments || null,
                professor_id: evaluation.professorId || evaluation.professor_id || null,
                status_evaluation: evaluation.status || 'completed' // Estado de la evaluación
            };
        });
        
        console.log(`[Student] Evaluaciones convertidas a prácticas: ${evaluatedPractices.length}`);
        
        // Separar prácticas del usuario (sin evaluar)
        const userPractices = (this.practices || []).filter(p => p.type !== 'evaluated');
        
        // Crear un mapa de prácticas evaluadas por signo y fecha para evitar duplicados
        const evaluatedMap = new Map();
        evaluatedPractices.forEach(evaluation => {
            const key = `${evaluation.sign}-${new Date(evaluation.date).toDateString()}`;
            if (!evaluatedMap.has(key)) {
                evaluatedMap.set(key, evaluation);
            }
        });
        
        // Filtrar prácticas del usuario que ya tienen evaluación
        const practicesWithoutEvaluation = userPractices.filter(practice => {
            const key = `${practice.sign}-${new Date(practice.date).toDateString()}`;
            return !evaluatedMap.has(key);
        });
        
        // Ordenar evaluaciones por fecha (más recientes primero)
        const sortedEvaluations = Array.from(evaluatedMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Ordenar prácticas del usuario por fecha (más recientes primero)
        const sortedPractices = practicesWithoutEvaluation.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Combinar: PRIMERO las evaluaciones, DESPUÉS las prácticas del usuario
        this.practices = [...sortedEvaluations, ...sortedPractices];
        
        console.log(`[Student] ✅ Total de prácticas combinadas: ${this.practices.length}`);
        console.log(`[Student]   - Evaluaciones del profesor: ${sortedEvaluations.length}`);
        console.log(`[Student]   - Prácticas del usuario: ${sortedPractices.length}`);
    }
    
    async loadEvaluations() {
        try {
            console.log('[Student] Cargando evaluaciones...');
            const response = await fetch(`${window.API_BASE_URL || '/api'}/student/my-evaluations`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                console.warn(`[Student] Error en respuesta de evaluaciones: ${response.status}`);
                this.evaluations = [];
                return;
            }

            const data = await response.json();
            console.log('[Student] Respuesta de my-evaluations:', {
                success: data.success,
                evaluationsCount: data.data?.evaluations?.length || 0,
                total: data.data?.total || 0
            });
            
            this.evaluations = data.data?.evaluations || [];
            
            if (this.evaluations.length > 0) {
                console.log(`[Estudiante] Cargadas ${this.evaluations.length} evaluaciones del profesor`);
            } else {
                console.warn('[Estudiante] ⚠️ No se encontraron evaluaciones para este estudiante');
            }
            
        } catch (error) {
            console.error('[Student] Error cargando evaluaciones:', error);
            this.evaluations = [];
        }
    }

    async loadPractices() {
        try {
            console.log('[Student] ===== INICIANDO CARGA DE PRÁCTICAS =====');
            console.log('[Student] Token disponible:', !!this.token);
            console.log('[Student] API Base URL:', window.API_BASE_URL || '/api');
            
            // Cargar prácticas desde Railway (tabla gesture_attempts)
            const apiUrl = `${window.API_BASE_URL || '/api'}/student/my-attempts`;
            console.log('[Student] Cargando prácticas desde Railway:', apiUrl);
            
            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('[Student] Respuesta recibida:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });

            if (!response.ok) {
                console.error(`[Student] ❌ Error en respuesta de API: ${response.status} ${response.statusText}`);
                try {
                    const errorData = await response.json();
                    console.error(`[Student] Detalles del error:`, errorData);
                } catch (e) {
                    const errorText = await response.text();
                    console.error(`[Student] Error como texto:`, errorText);
                }
                // No sobrescribir prácticas si ya hay datos de Firebase
                if (!this.practices || this.practices.length === 0) {
                    this.practices = [];
                }
                console.log('[Student] Prácticas de Railway no disponibles');
            } else {
                const data = await response.json();
                console.log('[Student] Respuesta de my-attempts:', {
                    success: data.success,
                    attemptsCount: data.data?.attempts?.length || 0,
                    total: data.data?.total || 0
                });
                
                // Mapear datos de las prácticas desde Railway
                const apiPractices = (data.data?.attempts || []).map(attempt => {
                    // Normalizar fecha
                    let date = attempt.date || attempt.created_at || new Date().toISOString();
                    if (typeof date === 'number') {
                        date = new Date(date).toISOString();
                    } else if (typeof date === 'string' && !date.includes('T')) {
                        date = new Date(date).toISOString();
                    }
                    
                    // Normalizar puntuación
                    let score = attempt.score || 0;
                    if (typeof score === 'string') {
                        score = parseFloat(score) || 0;
                    }
                    score = Math.max(0, Math.min(100, Math.round(score)));
                    
                    // Normalizar nombre del gesto
                    const sign = attempt.sign || attempt.gestureName || attempt.detectedLabel || attempt.gestureId || 'Gesto';
                    
                    return {
                        id: attempt.id || `gesture-${Date.now()}`,
                        gestureId: attempt.gestureId || null,
                        date: date,
                        sign: sign,
                        score: score,
                        status: attempt.status || this.getPerformanceStatus(score),
                        type: 'practice', // Marcar como práctica (no evaluación)
                        source: 'railway', // Marcar como dato de Railway
                        raw: attempt.raw || attempt // Guardar datos originales
                    };
                });
                
                console.log(`[Student] ✅ ${apiPractices.length} prácticas cargadas desde Railway`);
                
                // Combinar con prácticas existentes (si hay de Firebase)
                if (this.practices && this.practices.length > 0) {
                    // Filtrar prácticas de Railway que ya existen
                    const existingIds = new Set(this.practices.map(p => p.id));
                    const newPractices = apiPractices.filter(p => !existingIds.has(p.id));
                    this.practices = [...this.practices, ...newPractices];
                } else {
                    this.practices = apiPractices;
                }
            }
            
        } catch (error) {
            console.error('[Student] ❌ ERROR CRÍTICO cargando prácticas:', error);
            console.error('[Student] Tipo de error:', error.constructor.name);
            console.error('[Student] Mensaje:', error.message);
            console.error('[Student] Stack completo:', error.stack);
            
            // Asegurarse de que practices sea un array
            if (!Array.isArray(this.practices)) {
                this.practices = [];
            }
        }
    }
    
    async loadFirebasePractices() {
        try {
            console.log('[Student] ===== INICIANDO CARGA DE PRÁCTICAS DE FIREBASE =====');
            console.log('[Student] Token disponible:', !!this.token);
            console.log('[Student] API Base URL:', window.API_BASE_URL || '/api');
            
            // Cargar prácticas desde Firebase
            const apiUrl = `${window.API_BASE_URL || '/api'}/student/my-firebase-attempts`;
            console.log('[Student] Cargando prácticas desde Firebase:', apiUrl);
            
            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('[Student] Respuesta de Firebase recibida:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });

            if (!response.ok) {
                console.warn(`[Student] ⚠️ Error en respuesta de Firebase API: ${response.status} ${response.statusText}`);
                // No es crítico, puede que el usuario no tenga firebase_uid
                return;
            }
            
            const data = await response.json();
            console.log('[Student] Respuesta de my-firebase-attempts:', {
                success: data.success,
                attemptsCount: data.data?.attempts?.length || 0,
                total: data.data?.total || 0,
                summary: data.data?.summary
            });
            
            if (data.success && data.data && data.data.attempts) {
                const firebasePractices = data.data.attempts;
                
                console.log(`[Student] ✅ ${firebasePractices.length} prácticas cargadas desde Firebase`);
                
                // Combinar con prácticas existentes (si hay de Railway)
                if (this.practices && this.practices.length > 0) {
                    // Filtrar prácticas de Firebase que ya existen
                    const existingIds = new Set(this.practices.map(p => p.id));
                    const newPractices = firebasePractices.filter(p => !existingIds.has(p.id));
                    this.practices = [...this.practices, ...newPractices];
                } else {
                    this.practices = firebasePractices;
                }
                
                // Ordenar por fecha (más recientes primero)
                this.practices.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                console.log(`[Student] ✅ Total de prácticas después de Firebase: ${this.practices.length}`);
            }
            
        } catch (error) {
            console.error('[Student] ❌ ERROR cargando prácticas de Firebase:', error);
            console.error('[Student] Tipo de error:', error.constructor.name);
            console.error('[Student] Mensaje:', error.message);
            // No es crítico, continuar sin datos de Firebase
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
        console.log('[Dashboard] Actualizando estadísticas...');
        
        // Total de prácticas (incluye evaluaciones y prácticas de Railway)
        const totalPractices = this.practices.length;
        const evaluatedCount = this.practices.filter(p => p.type === 'evaluated').length;
        const evaluationsCount = this.evaluations?.length || 0;
        
        console.log('[Dashboard] Total prácticas:', totalPractices);
        console.log('[Dashboard] Total evaluaciones:', evaluationsCount);
        
        document.getElementById('totalPractices').textContent = totalPractices;
        
        // Calcular promedio y mejor puntuación
        let averageScore = 0;
        let bestScore = 0;
        
        if (this.practices.length > 0) {
            // Si hay evaluaciones, usar solo el promedio de las evaluaciones
            if (evaluationsCount > 0) {
                const evaluatedPractices = this.practices.filter(p => p.type === 'evaluated');
                if (evaluatedPractices.length > 0) {
                    averageScore = Math.round(evaluatedPractices.reduce((sum, p) => sum + (p.score || 0), 0) / evaluatedPractices.length);
                    bestScore = Math.max(...evaluatedPractices.map(p => p.score || 0));
                    console.log(`[Dashboard] ✓ Usando promedio de evaluaciones: ${averageScore}% (${evaluationsCount} evaluaciones)`);
                } else {
                    // Si hay evaluaciones pero no se han combinado todavía, usar todas las prácticas
                    averageScore = Math.round(this.practices.reduce((sum, p) => sum + (p.score || 0), 0) / totalPractices);
                    bestScore = Math.max(...this.practices.map(p => p.score || 0));
                    console.log(`[Dashboard] ✓ Usando promedio de prácticas: ${averageScore}% (${totalPractices} prácticas)`);
                }
            } else {
                // Si no hay evaluaciones, usar todas las prácticas
                averageScore = Math.round(this.practices.reduce((sum, p) => sum + (p.score || 0), 0) / totalPractices);
                bestScore = Math.max(...this.practices.map(p => p.score || 0));
                console.log(`[Dashboard] ✓ Usando promedio de prácticas: ${averageScore}% (${totalPractices} prácticas)`);
            }
        } else {
            console.warn('[Dashboard] ⚠️ No hay prácticas ni evaluaciones para mostrar');
        }
        
        // Última práctica (más reciente)
        const lastPractice = this.practices[0] ? new Date(this.practices[0].date).toLocaleDateString('es-ES') : 'N/A';
        
        document.getElementById('averageScore').textContent = `${averageScore}%`;
        document.getElementById('bestScore').textContent = `${bestScore}%`;
        document.getElementById('lastPractice').textContent = lastPractice;
        
        console.log(`[Dashboard] Estadísticas actualizadas: ${totalPractices} prácticas, promedio ${averageScore}%`);
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
        
        // Separar evaluaciones y prácticas para renderizar con secciones
        const evaluations = this.practices.filter(p => p.type === 'evaluated');
        const userPractices = this.practices.filter(p => p.type !== 'evaluated');
        
        let html = '';
        
        // PRIMERO: Mostrar evaluaciones del profesor
        if (evaluations.length > 0) {
            evaluations.forEach(practice => {
                const isEvaluated = true;
                const badgeIcon = '<i class="fas fa-check-circle"></i> ';
                const badgeText = practice.status_evaluation === 'completed' ? 'Revisada' : 'Pendiente';
                
                html += `
                <tr class="practice-evaluated">
                    <td>${new Date(practice.date).toLocaleDateString('es-ES')}</td>
                    <td>
                        ${practice.sign}
                        <span class="evaluated-badge" title="Evaluación revisada por el profesor">
                            <i class="fas fa-check-circle"></i> Evaluada
                        </span>
                    </td>
                    <td>
                        <span class="practice-score score-${practice.status}">
                            ${practice.score}%
                        </span>
                    </td>
                    <td>
                        <span class="status-badge status-${practice.status} status-evaluated">
                            ${badgeIcon}${badgeText}
                        </span>
                    </td>
                    <td>
                        <button onclick="studentPanel.viewPractice('${practice.id}')" class="btn btn-sm btn-primary">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                    </td>
                </tr>
                `;
            });
        }
        
        // SEGUNDO: Mostrar prácticas del usuario
        if (userPractices.length > 0) {
            userPractices.forEach(practice => {
                const badgeText = this.getStatusText(practice.status);
                
                html += `
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
                            ${badgeText}
                        </span>
                    </td>
                    <td>
                        <button onclick="studentPanel.viewPractice('${practice.id}')" class="btn btn-sm btn-primary">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                    </td>
                </tr>
                `;
            });
        }
        
        tbody.innerHTML = html;
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
        
        // Separar evaluaciones y prácticas para mantener el orden
        const evaluations = practices.filter(p => p.type === 'evaluated');
        const userPractices = practices.filter(p => p.type !== 'evaluated');
        
        let html = '';
        
        // PRIMERO: Mostrar evaluaciones del profesor
        if (evaluations.length > 0) {
            evaluations.forEach(practice => {
                const badgeIcon = '<i class="fas fa-check-circle"></i> ';
                const badgeText = practice.status_evaluation === 'completed' ? 'Revisada' : 'Pendiente';
                
                html += `
                <tr class="practice-evaluated">
                    <td>${new Date(practice.date).toLocaleDateString('es-ES')}</td>
                    <td>
                        ${practice.sign}
                        <span class="evaluated-badge" title="Evaluación revisada por el profesor">
                            <i class="fas fa-check-circle"></i> Evaluada
                        </span>
                    </td>
                    <td>
                        <span class="practice-score score-${practice.status}">
                            ${practice.score}%
                        </span>
                    </td>
                    <td>
                        <span class="status-badge status-${practice.status} status-evaluated">
                            ${badgeIcon}${badgeText}
                        </span>
                    </td>
                    <td>
                        <button onclick="studentPanel.viewPractice('${practice.id}')" class="btn btn-sm btn-primary">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                    </td>
                </tr>
                `;
            });
        }
        
        // SEGUNDO: Mostrar prácticas del usuario
        if (userPractices.length > 0) {
            userPractices.forEach(practice => {
                html += `
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
                        <button onclick="studentPanel.viewPractice('${practice.id}')" class="btn btn-sm btn-primary">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                    </td>
                </tr>
                `;
            });
        }
        
        tbody.innerHTML = html;
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
        const practice = this.practices.find(p => String(p.id) === String(practiceId));
        if (!practice) return;

        const raw = practice.raw || {};
        const modal = document.getElementById('viewPracticeModal');

        // Fecha
        const formattedDate = practice.date
            ? new Date(practice.date).toLocaleString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
            : 'Sin fecha registrada';
        document.getElementById('practiceDetailDate').textContent = formattedDate;

        // Seña - Obtener el nombre del gesto desde diferentes fuentes
        let gestureName = practice.sign || 'Desconocida';
        
        // Si es una evaluación, intentar obtener el nombre del gesto desde la evaluación
        if (practice.type === 'evaluated' && practice.evaluation) {
            const evaluation = practice.evaluation;
            gestureName = evaluation.gestureName || 
                         evaluation.gesture_name || 
                         evaluation.sign || 
                         evaluation.gestureId || 
                         practice.sign || 
                         'Gesto evaluado';
        }
        
        document.getElementById('practiceDetailSign').textContent = gestureName;

        // Puntaje
        const scoreSpan = document.getElementById('practiceDetailScore');
        scoreSpan.textContent = `${practice.score}%`;
        scoreSpan.className = `score-badge score-${practice.status}`;

        // Estado
        const statusSpan = document.getElementById('practiceDetailStatus');
        statusSpan.textContent = this.getStatusText(practice.status);
        statusSpan.className = `status-badge ${practice.status}`;

        // Confianza / Precisión
        const confidenceValue = raw.confidence ?? raw.percentage ?? null;
        const confidenceText = (() => {
            if (confidenceValue === null || confidenceValue === undefined) return 'No disponible';
            const numeric = Number(confidenceValue);
            if (Number.isNaN(numeric)) return confidenceValue;
            return `${Math.round(numeric * (numeric <= 1 ? 100 : 1))}%`;
        })();
        document.getElementById('practiceDetailConfidence').textContent = confidenceText;

        // Detección (etiqueta detectada)
        const detected = raw.detectedLabel || raw.predictedLabel || raw.label || 'No disponible';
        document.getElementById('practiceDetailDetected').textContent = detected;

        // Identificadores y metadatos
        const tagsContainer = document.getElementById('practiceDetailIds');
        tagsContainer.innerHTML = '';
        const pushTag = (label, value) => {
            if (!value) return;
            const tag = document.createElement('span');
            tag.className = 'detail-tag';
            tag.textContent = `${label}: ${value}`;
            tagsContainer.appendChild(tag);
        };

        const gestureId = raw.gestureId || practice.gestureId || String(practice.id).split('::')[0];
        const attemptId = raw.attemptId || raw.id || practice.id;
        pushTag('Gesto ID', gestureId);
        pushTag('Intento ID', attemptId);
        if (raw.deviceInfo?.model) pushTag('Dispositivo', raw.deviceInfo.model);
        if (raw.deviceInfo?.platform) pushTag('Sistema', raw.deviceInfo.platform);

        // Notas u observaciones
        // Comentarios del profesor (evaluaciones)
        let relatedEvaluation = null;
        
        // Si la práctica ya tiene la evaluación asociada, usarla directamente
        if (practice.type === 'evaluated' && practice.evaluation) {
            relatedEvaluation = practice.evaluation;
        } else {
            // Si no, buscar en las evaluaciones
            relatedEvaluation = (this.evaluations || []).find(evaluation => {
                // Comparar por attemptId exacto
                const evalAttemptId = evaluation.attemptId || evaluation.attempt_id || null;
                const practiceAttemptId = raw.attemptId || practice.id;
                if (evalAttemptId && practiceAttemptId && String(evalAttemptId) === String(practiceAttemptId)) {
                    return true;
                }

                // Comparar por gestureId si existe
                const evalGestureId = evaluation.gestureId || evaluation.gesture_id || null;
                if (evalGestureId && practice.gestureId && String(evalGestureId) === String(practice.gestureId)) {
                    return true;
                }

                // Comparar por gestureName + proximidad temporal (2 horas)
                const evalGestureName = evaluation.gestureName || evaluation.gesture_name || '';
                const practiceGestureName = practice.sign || gestureName || '';
                if (evalGestureName && practiceGestureName && evalGestureName.toLowerCase() === practiceGestureName.toLowerCase()) {
                    const evalTime = evaluation.attemptTimestamp || evaluation.attempt_timestamp || evaluation.created_at;
                    if (evalTime && practice.date) {
                        const diffMs = Math.abs(new Date(evalTime).getTime() - new Date(practice.date).getTime());
                        if (diffMs <= 1000 * 60 * 60 * 2) { // 2 horas
                            return true;
                        }
                    }
                }

                return false;
            });
        }

        const teacherNotes = relatedEvaluation?.comments?.trim();
        document.getElementById('practiceDetailNotes').textContent = teacherNotes || 'Sin comentarios';

        // Si es una evaluación, mostrar información adicional
        if (practice.type === 'evaluated' && relatedEvaluation) {
            // Actualizar el nombre del gesto en el detalle si es necesario
            const evalGestureName = relatedEvaluation.gestureName || relatedEvaluation.gesture_name;
            if (evalGestureName && evalGestureName !== gestureName) {
                document.getElementById('practiceDetailSign').textContent = evalGestureName;
            }
        }

        modal.style.display = 'block';
    }

    closeViewPracticeModal() {
        const modal = document.getElementById('viewPracticeModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    cleanup() {
        // Limpiar auto-refresh si existe
        this.stopAutoRefresh();
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
    if (window.studentPanel) {
        window.studentPanel.cleanup();
    }
    localStorage.removeItem('token');
    window.location.href = '/login';
}

// Inicializar el panel cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    window.studentPanel = new StudentPanel();
});
window.addEventListener('beforeunload', () => {
    if (window.studentPanel) {
        window.studentPanel.cleanup();
    }
});