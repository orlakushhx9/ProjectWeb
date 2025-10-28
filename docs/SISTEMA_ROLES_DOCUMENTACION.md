# Sistema de Roles - Gestus

## Descripción General

Se ha implementado un sistema completo de roles para la aplicación Gestus que permite diferentes niveles de acceso y funcionalidades según el tipo de usuario:

- **Administrador**: Gestión completa del sistema
- **Profesor**: Evaluación y seguimiento de estudiantes
- **Estudiante**: Visualización de su propio progreso
- **Padre**: Monitoreo del progreso de sus hijos

## Roles Implementados

### 1. Administrador (`admin`)

**Funcionalidades:**
- Ver todos los usuarios registrados en el sistema
- Cambiar roles de usuarios
- Asignar relaciones padre-hijo
- Ver estadísticas generales del sistema
- Gestión completa de usuarios

**Acceso:**
- URL: `/admin`
- Credenciales por defecto: `admin@gestus.com` / `admin.js:372 Cambiando rol: Object
api/users/1/role:1  Failed to load resource: the server responded with a status of 400 (Bad Request)
admin.js:415 Error cambiando rol: Error: Datos de entrada inválidos
    at AdminPanel.changeUserRole (admin.js:401:23)
changeUserRole @ admin.js:415
admin.js:372 Cambiando rol: Object
api/users/1/role:1  Failed to load resource: the server responded with a status of 400 (Bad Request)
admin.js:415 Error cambiando rol: Error: Datos de entrada inválidos
    at AdminPanel.changeUserRole (admin.js:401:23)
changeUserRole @ admin.js:415
`

**Rutas API:**
- `GET /api/users/all` - Obtener todos los usuarios
- `GET /api/users/by-role/:role` - Obtener usuarios por rol
- `PUT /api/users/:userId/role` - Cambiar rol de usuario

### 2. Profesor (`profesor`)

**Funcionalidades:**
- Ver lista de todos los estudiantes
- Evaluar el desempeño de estudiantes
- Ver datos de señas de estudiantes
- Calificar gestos (0-10)
- Ver estadísticas de progreso
- Crear evaluaciones con comentarios

**Acceso:**
- URL: `/professor`

**Rutas API:**
- `GET /api/professor/students` - Obtener estudiantes
- `GET /api/professor/students/:studentId/sign-data` - Datos de señas del estudiante
- `POST /api/professor/students/:studentId/evaluation` - Crear evaluación
- `GET /api/professor/students/:studentId/evaluations` - Ver evaluaciones
- `GET /api/professor/students/:studentId/progress` - Progreso del estudiante

### 3. Estudiante (`estudiante`)

**Funcionalidades:**
- Ver su propio progreso de aprendizaje
- Visualizar historial de intentos
- Ver sesiones de práctica completadas
- Revisar evaluaciones del profesor
- Estadísticas personales

**Acceso:**
- URL: `/student`

**Rutas API:**
- `GET /api/student/my-progress` - Progreso personal
- `GET /api/student/my-attempts` - Historial de intentos
- `GET /api/student/my-sessions` - Sesiones de práctica
- `GET /api/student/my-stats` - Estadísticas personales

### 4. Padre (`padre`)

**Funcionalidades:**
- Ver información de sus hijos asignados
- Monitorear progreso de cada hijo
- Ver actividad reciente de los hijos
- Revisar evaluaciones del profesor
- Estadísticas de progreso por hijo

**Acceso:**
- URL: `/parent`

**Rutas API:**
- `GET /api/parent/my-children` - Obtener hijos
- `GET /api/parent/children/:childId/progress` - Progreso del hijo
- `GET /api/parent/children/summary` - Resumen de todos los hijos
- `GET /api/parent/children/recent-activity` - Actividad reciente

## Estructura de Base de Datos

### Tabla `users` (Actualizada)

```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'profesor', 'estudiante', 'padre') DEFAULT 'estudiante',
    parent_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_parent_id (parent_id),
    FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL
);
```

### Nuevas Columnas:
- `role`: Define el tipo de usuario
- `parent_id`: Relación padre-hijo (solo para estudiantes)

## Middleware de Autenticación

Se ha creado un sistema de middleware robusto en `middleware/auth.js`:

### Middlewares Disponibles:
- `authenticateToken`: Verificación básica de token JWT
- `requireRole(...roles)`: Verificación de roles específicos
- `requireAdmin`: Solo administradores
- `requireProfessor`: Solo profesores
- `requireStudent`: Solo estudiantes
- `requireParent`: Solo padres
- `requireProfessorOrAdmin`: Profesores y administradores
- `requireStudentAccess`: Acceso a datos de estudiante específico
- `requireParentAccess`: Acceso a datos de padre específico

## Flujo de Trabajo

### 1. Registro de Usuarios
- Los usuarios se registran por defecto como `estudiante`
- Solo los administradores pueden cambiar roles
- Los estudiantes pueden tener un padre asignado

### 2. Asignación de Roles
- El administrador puede cambiar roles desde `/admin`
- Se puede asignar un padre a un estudiante
- No se puede eliminar el último administrador

### 3. Evaluaciones
- Los profesores pueden evaluar estudiantes
- Las evaluaciones se almacenan en `sign_language_data` con tipo 'evaluation'
- Los estudiantes pueden ver sus evaluaciones
- Los padres pueden ver evaluaciones de sus hijos

### 4. Progreso y Estadísticas
- Cada rol tiene acceso a diferentes niveles de información
- Los datos se filtran automáticamente según el rol
- Se mantiene privacidad entre usuarios

## Archivos Creados/Modificados

### Modelos:
- `models/User.js` - Actualizado con métodos de roles
- `models/SignLanguage.js` - Agregado método getConnection

### Middleware:
- `middleware/auth.js` - Nuevo sistema de autenticación por roles

### Rutas:
- `routes/users.js` - Agregadas rutas de administrador
- `routes/professor.js` - Nuevas rutas para profesores
- `routes/student.js` - Nuevas rutas para estudiantes
- `routes/parent.js` - Nuevas rutas para padres

### Vistas:
- `public/views/admin.html` - Panel de administración
- `public/views/professor.html` - Panel de profesor
- `public/views/student.html` - Panel de estudiante
- `public/views/parent.html` - Panel de padre

### Estilos:
- `public/css/admin.css` - Estilos para administrador
- `public/css/professor.css` - Estilos para profesor
- `public/css/student.css` - Estilos para estudiante
- `public/css/parent.css` - Estilos para padre

### JavaScript:
- `public/js/admin.js` - Lógica del panel de administración
- `public/js/professor.js` - Lógica del panel de profesor
- `public/js/student.js` - Lógica del panel de estudiante
- `public/js/parent.js` - Lógica del panel de padre

### Configuración:
- `config/database.js` - Actualizado para crear tabla con roles
- `server.js` - Agregadas nuevas rutas

## Instrucciones de Uso

### 1. Inicialización
```bash
# El sistema creará automáticamente:
# - Tabla users con columnas de roles
# - Usuario administrador por defecto
```

### 2. Acceso como Administrador
1. Ir a `/login`
2. Usar credenciales: `admin@gestus.com` / `admin123`
3. Acceder a `/admin` para gestión de usuarios

### 3. Crear Usuarios con Roles
1. Como administrador, ir a "Gestión de Roles"
2. Seleccionar usuario existente
3. Cambiar rol según necesidad
4. Asignar padre si es estudiante

### 4. Evaluaciones de Profesor
1. Acceder como profesor a `/professor`
2. Ver lista de estudiantes
3. Crear evaluaciones con calificaciones y comentarios
4. Monitorear progreso de estudiantes

### 5. Monitoreo de Padres
1. Acceder como padre a `/parent`
2. Ver progreso de hijos asignados
3. Revisar evaluaciones del profesor
4. Monitorear actividad reciente

## Seguridad

- Tokens JWT incluyen información de rol
- Middleware verifica permisos en cada endpoint
- Los usuarios solo pueden acceder a sus propios datos
- Los padres solo ven información de sus hijos
- Los profesores pueden ver todos los estudiantes
- Los administradores tienen acceso completo

## Consideraciones Futuras

- Implementar notificaciones entre roles
- Agregar más tipos de evaluaciones
- Crear reportes avanzados
- Implementar sistema de mensajería
- Agregar métricas de rendimiento por rol
