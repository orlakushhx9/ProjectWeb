// Panel de Estudiante - JavaScript
class StudentPanel {
    constructor() {
        this.token = localStorage.getItem('token');
        this.userData = null;
        this.practices = [];
        this.evaluations = []; // Evaluaciones del profesor
        this.firebase = {
            service: window.firebaseDataService || null,
            uid: null,
            unsubProfile: null,
            unsubAttempts: null
        };
        
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
            
            // Intentar configurar Firebase, pero no bloquear si falla
            try {
                await this.setupFirebaseIntegration();
            } catch (firebaseError) {
                console.warn('[Student] ⚠️ Firebase no disponible, continuando sin Firebase:', firebaseError.message);
                // Continuar sin Firebase
            }
            
            this.setupNavigation();
            this.setupEventListeners();
            await this.loadDashboardData();
            
            // 🔄 AUTO-REFRESH: Actualizar gestos en tiempo real cada 5 segundos
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
                await this.loadPractices();
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
            
            // Paso 1: Si Firebase ya cargó prácticas, mostrar estadísticas primero
            if (this.practices.length > 0) {
                console.log('[Student] Paso 1: Mostrando prácticas de Firebase ya cargadas...');
                this.updateDashboardStats();
                console.log(`[Student] Prácticas de Firebase: ${this.practices.length}`);
            }
            
            // Paso 2: Cargar evaluaciones del profesor
            console.log('[Student] Paso 2: Cargando evaluaciones...');
            await this.loadEvaluations();
            console.log('[Student] Paso 2 completado. Evaluaciones:', this.evaluations.length);
            
            // Paso 3: Cargar prácticas desde la API (NO depende de Firebase)
            // Esto asegura que siempre tengamos prácticas, incluso si Firebase falla
            console.log('[Student] Paso 3: Cargando prácticas desde API...');
            const practicesBeforeAPI = this.practices.length;
            await this.loadPractices();
            console.log('[Student] Paso 3 completado. Prácticas antes de API:', practicesBeforeAPI, 'Después:', this.practices.length);
            
            // Paso 4: Combinar evaluaciones con prácticas
            console.log('[Student] Paso 4: Combinando prácticas y evaluaciones...');
            this.combinePracticesAndEvaluations();
            console.log('[Student] Paso 4 completado. Total prácticas combinadas:', this.practices.length);
            
            // Paso 5: Actualizar estadísticas del dashboard (final)
            console.log('[Student] Paso 5: Actualizando estadísticas finales...');
            this.updateDashboardStats();
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
        
        // Convertir evaluaciones del profesor a formato de práctica
        const evaluatedPractices = (this.evaluations || []).map(evaluation => ({
            id: `eval-${evaluation.id}`,
            date: evaluation.attempt_timestamp || evaluation.created_at || new Date().toISOString(),
            sign: evaluation.gesture_name || 'Gesto evaluado',
            score: evaluation.score || 0,
            status: this.getPerformanceStatus(evaluation.score || 0),
            type: 'evaluated', // Marcar como evaluada
            evaluation: evaluation, // Guardar datos completos de la evaluación
            comments: evaluation.comments || null,
            professor_id: evaluation.professor_id || null
        }));
        
        console.log(`[Student] Evaluaciones convertidas a prácticas: ${evaluatedPractices.length}`);
        
        // Combinar prácticas de Firebase con evaluaciones
        // Las evaluaciones tienen prioridad (son más recientes y revisadas)
        const allPractices = [...evaluatedPractices, ...this.practices];
        
        // Eliminar duplicados basándose en fecha y signo (si una práctica tiene evaluación, priorizar la evaluación)
        const uniquePractices = [];
        const seen = new Map();
        
        allPractices.forEach(practice => {
            const key = `${practice.sign}-${new Date(practice.date).toDateString()}`;
            if (!seen.has(key) || practice.type === 'evaluated') {
                if (seen.has(key) && practice.type === 'evaluated') {
                    // Reemplazar práctica con evaluación
                    const index = uniquePractices.findIndex(p => 
                        `${p.sign}-${new Date(p.date).toDateString()}` === key
                    );
                    if (index !== -1) {
                        uniquePractices[index] = practice;
                    }
                } else {
                    uniquePractices.push(practice);
                    seen.set(key, true);
                }
            }
        });
        
        // Ordenar por fecha (más recientes primero)
        uniquePractices.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        this.practices = uniquePractices;
        console.log(`[Student] ✅ Total de prácticas combinadas: ${this.practices.length} (${evaluatedPractices.length} evaluadas, ${this.practices.length - evaluatedPractices.length} de Firebase)`);
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
            
            // SIEMPRE cargar desde la API primero (Firebase Admin)
            const apiUrl = `${window.API_BASE_URL || '/api'}/student/my-attempts`;
            console.log('[Student] Cargando prácticas desde API:', apiUrl);
            
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
                this.practices = [];
                console.log('[Student] Prácticas establecidas como array vacío debido a error');
            } else {
                const data = await response.json();
                console.log('[Student] Respuesta de my-attempts:', {
                    success: data.success,
                    attemptsCount: data.data?.attempts?.length || 0,
                    summary: data.data?.summary
                });
                
                // Mapear datos de las prácticas desde la API
                const apiPractices = (data.data?.attempts || []).map(attempt => {
                    // Normalizar timestamp
                    let date = attempt.date || attempt.timestamp || new Date().toISOString();
                    if (typeof date === 'number') {
                        date = new Date(date).toISOString();
                    } else if (typeof date === 'string' && !date.includes('T')) {
                        // Si es solo fecha, convertir a ISO
                        date = new Date(date).toISOString();
                    }
                    
                    // Normalizar puntuación
                    let score = attempt.percentage || attempt.score || 0;
                    if (typeof score === 'string') {
                        score = parseFloat(score) || 0;
                    }
                    score = Math.max(0, Math.min(100, Math.round(score)));
                    
                    // Normalizar nombre del gesto
                    const sign = attempt.sign || attempt.gestureName || attempt.detectedLabel || attempt.gestureId || 'Gesto';
                    
                    return {
                        id: attempt.id || `${attempt.gestureId || 'gesto'}-${attempt.timestamp || Date.now()}`,
                        date: date,
                        sign: sign,
                        score: score,
                        status: this.getPerformanceStatus(score),
                        source: 'api',
                        raw: attempt // Guardar datos originales para debugging
                    };
                });
                
                console.log(`[Student] ✅ ${apiPractices.length} prácticas cargadas desde API`);
                
            // Si Firebase está disponible y tiene datos, combinar ambos
            // Nota: Las prácticas de Firebase se cargan en setupFirebaseIntegration()
            // y se aplican mediante applyFirebasePractices()
            // Aquí solo usamos las prácticas de la API
            this.practices = apiPractices;
            }
            
            // Combinar con evaluaciones si ya están cargadas
            if (this.evaluations && this.evaluations.length > 0) {
                console.log('[Student] Combinando prácticas con evaluaciones...');
                this.combinePracticesAndEvaluations();
            }
            
            console.log(`[Student] ✅ Total final de prácticas: ${this.practices.length}`);
            this.renderPracticesTable();
            this.renderRecentPractices();
            this.updateDashboardStats();
            this.updateProfileStats();
            
        } catch (error) {
            console.error('[Student] ❌ ERROR CRÍTICO cargando prácticas:', error);
            console.error('[Student] Tipo de error:', error.constructor.name);
            console.error('[Student] Mensaje:', error.message);
            console.error('[Student] Stack completo:', error.stack);
            
            // Asegurarse de que practices sea un array
            if (!Array.isArray(this.practices)) {
                this.practices = [];
            }
            
            // Intentar renderizar incluso con error
            try {
                this.renderPracticesTable();
                this.renderRecentPractices();
                this.updateDashboardStats();
                this.updateProfileStats();
            } catch (renderError) {
                console.error('[Student] Error al renderizar después de fallo:', renderError);
            }
            
            if (!silent) {
                this.showMessage('Error cargando prácticas: ' + error.message, 'error');
            }
        }
    }
    
    async setupFirebaseIntegration() {
        console.log('[Firebase] Iniciando integración...');
        
        // Esperar a que firebase-data.js se cargue (si es módulo ES6)
        // Verificar si window.firebaseDataService existe
        if (!window.firebaseDataService) {
            console.log('[Firebase] Esperando a que firebaseDataService se cargue...');
            // Esperar hasta 5 segundos (50 intentos x 100ms)
            for (let i = 0; i < 50; i++) {
                await new Promise(resolve => setTimeout(resolve, 100));
                if (window.firebaseDataService) {
                    break;
                }
            }
        }
        
        // Actualizar referencia al servicio
        this.firebase.service = window.firebaseDataService || null;
        const service = this.firebase?.service;
        
        console.log('[Firebase] Service ready?', service?.isReady);
        console.log('[Firebase] User email:', this.userData?.email);
        
        if (!service) {
            console.warn('[Firebase] ⚠️ window.firebaseDataService no está disponible. Verifica que firebase-data.js se haya cargado correctamente.');
            return;
        }
        
        if (!service.isReady) {
            console.warn('[Firebase] ⚠️ Service no está listo (isReady: false). Verifica window.__FIREBASE_CONFIG__ y la inicialización de Firebase.');
            console.warn('[Firebase] Continuando sin Firebase. Los datos se cargarán desde la API.');
            return;
        }
        
        if (!this.userData?.email) {
            console.warn('[Firebase] No hay email de usuario');
            return;
        }

        try {
            console.log(`[Firebase] Buscando usuario con email: ${this.userData.email}`);
            const firebaseUser = await service.findUserByEmail(this.userData.email);
            
            if (!firebaseUser) {
                console.warn(`[Firebase] ⚠️ No se encontró un usuario con correo ${this.userData.email}`);
                console.warn(`[Firebase] El usuario debe estar registrado en Firebase Realtime Database`);
                console.warn(`[Firebase] Continuando sin Firebase. Los datos se cargarán desde la API.`);
                return;
            }

            console.log(`[Firebase] ✓ Usuario encontrado con UID: ${firebaseUser.uid}`);
            this.firebase.uid = firebaseUser.uid;
            this.updateProfileFromFirebase(firebaseUser);

            console.log(`[Firebase] Obteniendo intentos de gestos...`);
            const rawAttempts = await service.getGestureAttempts(firebaseUser.uid);
            
            const initialAttempts = service.normalizeGestureAttempts(rawAttempts);
            console.log(`[Firebase] ✓ Encontrados ${initialAttempts.length} intentos de gestos`);
            
            // Aplicar prácticas de Firebase pero NO actualizar estadísticas todavía
            // loadDashboardData se encargará de actualizar las estadísticas en el orden correcto
            this.applyFirebasePractices(initialAttempts, false);

            this.cleanupFirebaseListeners();
            console.log(`[Firebase] Configurando listeners en tiempo real...`);
            this.firebase.unsubProfile = service.subscribeUserProfile(firebaseUser.uid, (profile) => {
                if (profile) {
                    console.log(`[Firebase] Perfil actualizado desde Firebase`);
                    this.updateProfileFromFirebase({ uid: firebaseUser.uid, ...profile });
                }
            });
            this.firebase.unsubAttempts = service.subscribeGestureAttempts(firebaseUser.uid, (rawAttempts) => {
                console.log(`[Firebase] Intentos actualizados desde Firebase`);
                const attempts = service.normalizeGestureAttempts(rawAttempts);
                // Cuando se actualiza en tiempo real, sí actualizar estadísticas
                this.applyFirebasePractices(attempts, true);
            });
            console.log(`[Firebase] ✅ Integración con Firebase completada exitosamente`);
        } catch (error) {
            console.error('[Firebase] ❌ Error configurando integración con Firebase:', error);
            console.error('[Firebase] Tipo de error:', error.constructor.name);
            console.error('[Firebase] Mensaje:', error.message);
            console.error('[Firebase] Stack:', error.stack);
            console.warn('[Firebase] Continuando sin Firebase. Los datos se cargarán desde la API.');
        }
    }

    cleanupFirebaseListeners() {
        if (this.firebase?.unsubProfile) {
            this.firebase.unsubProfile();
            this.firebase.unsubProfile = null;
        }
        if (this.firebase?.unsubAttempts) {
            this.firebase.unsubAttempts();
            this.firebase.unsubAttempts = null;
        }
    }

    updateProfileFromFirebase(profile) {
        if (!profile) return;
        this.userData.firebaseProfile = profile;

        const name =
            profile.displayName ||
            profile.name ||
            this.userData.name;
        const email = profile.email || this.userData.email;

        const userNameEl = document.getElementById('userName');
        const profileNameEl = document.getElementById('profileName');
        const profileEmailEl = document.getElementById('profileEmail');

        if (userNameEl && name) userNameEl.textContent = name;
        if (profileNameEl && name) profileNameEl.textContent = name;
        if (profileEmailEl && email) profileEmailEl.textContent = email;

        if (profile.memberSince && document.getElementById('memberSince')) {
            const formatted = new Date(profile.memberSince).toLocaleDateString('es-ES');
            document.getElementById('memberSince').textContent = formatted;
        }
    }

    applyFirebasePractices(attempts, updateStats = true) {
        if (!Array.isArray(attempts)) {
            console.log('[Firebase] No hay intentos de Firebase o no es un array');
            return;
        }
        
        console.log(`[Firebase] Aplicando ${attempts.length} prácticas de Firebase`);
        
        // Convertir intentos de Firebase a formato de práctica
        const firebasePractices = attempts.map((attempt, index) => ({
            id: attempt.id || `firebase-${index}`,
            gestureId: attempt.gestureId || null,
            date: attempt.date || new Date().toISOString(),
            sign: attempt.sign || 'Gesto',
            score: typeof attempt.score === 'number' ? attempt.score : 0,
            status: this.getPerformanceStatus(typeof attempt.score === 'number' ? attempt.score : 0),
            source: 'firebase',
            raw: attempt.raw || attempt
        }));
        
        // Combinar con prácticas existentes (de la API)
        // Eliminar duplicados basándose en fecha y signo
        const existingPractices = this.practices || [];
        const combined = [...existingPractices];
        
        firebasePractices.forEach(fbPractice => {
            const exists = combined.some(p => 
                p.sign === fbPractice.sign && 
                Math.abs(new Date(p.date) - new Date(fbPractice.date)) < 60000 // Mismo minuto
            );
            if (!exists) {
                combined.push(fbPractice);
            }
        });
        
        // Ordenar por fecha (más recientes primero)
        combined.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        this.practices = combined;
        console.log(`[Firebase] ✅ Total de prácticas después de combinar: ${this.practices.length} (${firebasePractices.length} de Firebase, ${existingPractices.length} de API)`);

        // Solo actualizar estadísticas si se solicita explícitamente
        // Esto permite que loadDashboardData controle cuándo actualizar
        if (updateStats) {
            this.renderPracticesTable();
            this.renderRecentPractices();
            this.updateDashboardStats();
            this.updateProfileStats();
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
        
        // Total de prácticas (incluye evaluaciones y prácticas de Firebase)
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
        
        tbody.innerHTML = this.practices.map(practice => {
            const isEvaluated = practice.type === 'evaluated';
            const badgeIcon = isEvaluated ? '<i class="fas fa-check-circle"></i> ' : '';
            const badgeText = isEvaluated ? 'Revisada' : this.getStatusText(practice.status);
            
            return `
            <tr class="${isEvaluated ? 'practice-evaluated' : ''}">
                <td>${new Date(practice.date).toLocaleDateString('es-ES')}</td>
                <td>
                    ${practice.sign}
                    ${isEvaluated ? '<span class="evaluated-badge" title="Práctica revisada por el profesor"><i class="fas fa-check-circle"></i></span>' : ''}
                </td>
                <td>
                    <span class="practice-score score-${practice.status}">
                        ${practice.score}%
                    </span>
                </td>
                <td>
                    <span class="status-badge status-${practice.status} ${isEvaluated ? 'status-evaluated' : ''}">
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
        }).join('');
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
                    <button onclick="studentPanel.viewPractice('${practice.id}')" class="btn btn-sm btn-primary">
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

        // Seña
        document.getElementById('practiceDetailSign').textContent = practice.sign || 'Desconocida';

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
        const relatedEvaluation = (this.evaluations || []).find(evaluation => {
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
            if (evaluation.gestureName && evaluation.gestureName.toLowerCase() === (practice.sign || '').toLowerCase()) {
                const evalTime = evaluation.attemptTimestamp || evaluation.created_at;
                if (evalTime && practice.date) {
                    const diffMs = Math.abs(new Date(evalTime).getTime() - new Date(practice.date).getTime());
                    if (diffMs <= 1000 * 60 * 60 * 2) { // 2 horas
                        return true;
                    }
                }
            }

            return false;
        });

        const teacherNotes = relatedEvaluation?.comments?.trim();
        document.getElementById('practiceDetailNotes').textContent = teacherNotes || 'Sin comentarios';

        if (!teacherNotes && !relatedEvaluation) {
            console.log(`[Práctica] Sin evaluación del profesor asociada a ${practice.sign} (${practice.id})`);
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
        this.cleanupFirebaseListeners();
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