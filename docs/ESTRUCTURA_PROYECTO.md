# Estructura del Proyecto Sistema Web Gestus

## 📁 Organización de Carpetas

### 🎯 Estructura Principal
```
WEB/
├── 📁 config/                 # Configuración del servidor
│   ├── database.js            # Configuración de base de datos
│   └── config.env             # Variables de entorno
├── 📁 models/                 # Modelos de datos
│   └── User.js                # Modelo de usuario
├── 📁 routes/                 # Rutas del servidor (Backend)
│   ├── auth.js                # Rutas de autenticación
│   └── users.js               # Rutas de usuarios
├── 📁 utils/                  # Utilidades del servidor
│   └── jwt.js                 # Manejo de JWT
├── 📁 public/                 # Archivos públicos del frontend
│   ├── 📁 css/                # Hojas de estilo
│   ├── 📁 js/                 # Scripts JavaScript del frontend
│   ├── 📁 assets/              # Recursos estáticos
│   └── 📁 views/               # Plantillas HTML
├── 📁 docker/                 # Configuración de Docker
├── 📁 node_modules/           # Dependencias de Node.js
├── server.js                  # Servidor principal
├── package.json               # Configuración del proyecto
└── README.md                  # Documentación principal
```

### 🎨 Frontend (public/)
```
public/
├── 📁 css/                    # Estilos CSS
│   ├── app-shell.css          # Estilos del shell de la app
│   ├── dashboard.css          # Estilos del dashboard
│   ├── home.css               # Estilos de la página principal
│   └── styles.css             # Estilos generales
├── 📁 js/                     # Scripts JavaScript
│   ├── app-shell.js           # Lógica del shell de la app
│   ├── dashboard.js           # Lógica del dashboard
│   ├── home.js                # Lógica de la página principal
│   ├── script.js              # Scripts generales
│   └── sw.js                  # Service Worker
├── 📁 assets/                 # Recursos estáticos
│   ├── gestus.png             # Logo de la aplicación
│   ├── manifest.json          # Manifest de PWA
│   └── happy-path-diagram.md  # Diagrama de flujo
└── 📁 views/                  # Plantillas HTML
    ├── app-shell.html         # Shell principal de la aplicación
    ├── dashboard.html         # Página del dashboard
    ├── home.html              # Página principal
    ├── index.html             # Página de redirección
    ├── login.html             # Página de login/registro
    └── hom1e.html             # Página adicional
```

## 🔧 Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **MySQL** - Base de datos
- **JWT** - Autenticación

### Frontend
- **HTML5** - Estructura
- **CSS3** - Estilos
- **JavaScript (Vanilla)** - Interactividad
- **PWA** - Aplicación web progresiva

## 🚀 Funcionalidades

### Sistema de Autenticación
- Login/Registro de usuarios
- Manejo de sesiones con JWT
- Dashboard personalizado

### Características PWA
- Service Worker para funcionalidad offline
- Manifest para instalación como app
- App Shell para navegación rápida

### Reconocimiento de Gestos
- Plataforma educativa inclusiva
- Videojuego "Guardianes del Saber"
- Comunicación mediante gestos

## 📝 Notas de Desarrollo

### Rutas Actualizadas
Después de la reorganización, todas las referencias en los archivos HTML han sido actualizadas para usar rutas relativas:

- CSS: `../css/archivo.css`
- JavaScript: `../js/archivo.js`
- Assets: `../assets/archivo.ext`

### Estructura de Navegación
- `index.html` → Redirige a `views/home.html`
- `app-shell.html` → Shell principal con navegación SPA
- `login.html` → Autenticación y registro
- `dashboard.html` → Panel de usuario autenticado


----------------------------------------------

*Proyecto desarrollado por estudiantes de Ingeniería en Desarrollo y Gestión de Software de la Universidad Tecnológica de Santa Catarina*
