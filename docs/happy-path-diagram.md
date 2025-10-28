# Happy Path - Sistema Web Gestus

## Flujo Completo del Usuario

### 1. **Landing Page (Punto de Entrada)**
```
Usuario visita → app-shell.html
├── Ve hero section con CTA
├── Navega por secciones (Acerca de, Servicios, Eventos)
├── Decide registrarse o iniciar sesión
└── Click en "Registrarse" o "Iniciar Sesión"
```

### 2. **Registro de Nuevo Usuario**
```
Click "Registrarse" → #/register
├── Formulario de registro aparece
├── Usuario completa datos:
│   ├── Nombre completo
│   ├── Email válido
│   ├── Contraseña (mín. 6 caracteres)
│   └── Confirmación de contraseña
├── Validación en tiempo real
├── Envío a API /api/auth/register
├── Respuesta exitosa:
│   ├── Tokens guardados en localStorage
│   ├── Usuario autenticado
│   ├── Navegación actualizada
│   └── Redirección automática a Dashboard
└── Mensaje de éxito: "¡Registro exitoso!"
```

### 3. **Login de Usuario Existente**
```
Click "Iniciar Sesión" → #/login
├── Formulario de login aparece
├── Usuario ingresa credenciales:
│   ├── Email
│   └── Contraseña
├── Validación básica
├── Envío a API /api/auth/login
├── Respuesta exitosa:
│   ├── Tokens guardados en localStorage
│   ├── Usuario autenticado
│   ├── Navegación actualizada
│   └── Redirección automática a Dashboard
└── Mensaje de éxito: "¡Login exitoso!"
```

### 4. **Dashboard (Área Autenticada)**
```
Usuario autenticado → #/dashboard
├── Bienvenida personalizada
├── Información del perfil mostrada:
│   ├── Nombre del usuario
│   ├── Email
│   └── Fecha de registro
├── Acciones disponibles:
│   ├── Actualizar Perfil
│   └── Cambiar Contraseña
└── Navegación completa disponible
```

### 5. **Navegación SPA**
```
Usuario puede navegar sin recargar página:
├── #/home → Página principal
├── #/about → Acerca de nosotros
├── #/services → Nuestros servicios
├── #/events → Próximos eventos
├── #/contact → Información de contacto
└── #/dashboard → Área personal (solo autenticados)
```

### 6. **Gestión de Sesión**
```
Manejo automático de autenticación:
├── Verificación de token al cargar
├── Refresh token automático
├── Protección de rutas privadas
├── Logout limpio
└── Redirección inteligente
```

## Estados del Sistema

### **Estado No Autenticado**
- Navegación pública disponible
- Botones: "Iniciar Sesión" y "Registrarse"
- Acceso a: Home, About, Services, Events, Contact
- Redirección a login si intenta acceder a dashboard

### **Estado Autenticado**
- Navegación completa disponible
- Botones: "Dashboard" y "Cerrar Sesión"
- Acceso a todas las rutas incluyendo dashboard
- Información del usuario visible en header

## Flujo de Errores

### **Errores de Validación**
```
Formulario con errores:
├── Campos requeridos vacíos
├── Email inválido
├── Contraseñas no coinciden
└── Mensajes de error específicos mostrados
```

### **Errores de API**
```
Error de conexión o credenciales:
├── Mensaje de error mostrado
├── Formulario permanece disponible
├── Usuario puede reintentar
└── No se pierde información ingresada
```

### **Errores de Navegación**
```
Ruta no encontrada:
├── Página 404 mostrada
├── Botón "Volver al Inicio"
└── Navegación principal disponible
```

