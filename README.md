# Sistema Web con Express.js y Frontend Vanilla
## Características
- **Backend**: Express.js + Node.js
- **Base de datos**: MySQL (XAMPP)
- **Autenticación**: JWT (JSON Web Tokens)
- **Seguridad**: Hash de contraseñas con bcryptjs
- **Frontend**: HTML, CSS y JavaScript vanilla
- **Validaciones**: Frontend y backend
## Estructura del Proyecto
```
WEB/
├── config/
│   └── database.js          # Configuración de SQL Server
├── models/
│   └── User.js              # Modelo de usuario
├── routes/
│   ├── auth.js              # Rutas de autenticación
│   └── users.js             # Rutas de usuarios
├── public/
│   ├── index.html           # Página de login/registro
│   ├── dashboard.html       # Dashboard del usuario
│   ├── styles.css           # Estilos principales
│   ├── dashboard.css        # Estilos del dashboard
│   ├── script.js            # JavaScript principal
│   └── dashboard.js         # JavaScript del dashboard
├── server.js                # Servidor principal
├── package.json             # Dependencias del proyecto
├── config.env               # Configuración de entorno
└── README.md                # Este archivo
```
## Instalación

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Configurar MySQL (XAMPP)**:
   - Instala XAMPP y ejecuta Apache y MySQL
   - Crea una base de datos llamada `webprojectdb`
   - Ejecuta el script SQL proporcionado para crear las tablas

3. **Configurar variables de entorno**:
   Edita `config.env` y configura:
   ```
   PORT=3000
   JWT_SECRET=tu_clave_secreta_muy_segura_aqui
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=webprojectdb
   DB_USER=root
   DB_PASSWORD=
   ```

4. **Ejecutar el servidor**:
   ```bash
   # Desarrollo
   npm run dev
   
   # Producción
   npm start
   ```

5. **Acceder a la aplicación**:
   Abre tu navegador en `http://localhost:3000`

## Funcionalidades Implementadas

### Backend

- **Modelo de Usuario**:
  - Campos: id, name, email, password, created_at, updated_at
  - Hash seguro de contraseñas con bcryptjs
  - Validaciones de datos

- **Autenticación**:
  - Registro de usuarios
  - Login con JWT
  - Verificación de tokens
  - Middleware de autenticación

- **Rutas API**:
  - `POST /api/auth/register` - Registro
  - `POST /api/auth/login` - Login
  - `GET /api/auth/verify` - Verificar token
  - `GET /api/users/profile` - Obtener perfil
  - `PUT /api/users/profile` - Actualizar perfil
  - `DELETE /api/users/profile` - Eliminar cuenta

### Frontend

- **Formulario de Login**:
  - Validaciones en tiempo real
  - Toggle de visibilidad de contraseña
  - Manejo de errores
  - Estados de carga

- **Formulario de Registro**:
  - Validación de contraseñas
  - Confirmación de contraseña
  - Validación de email

- **Dashboard**:
  - Información del usuario
  - Gestión de perfil
  - Logout seguro

## Seguridad

- **Contraseñas**: Hash con bcryptjs (10 rounds)
- **Tokens**: JWT con expiración de 24 horas
- **Validaciones**: Frontend y backend
- **CORS**: Configurado para desarrollo
- **Sanitización**: Datos de entrada validados

## Responsive Design

- Diseño adaptable para móviles y desktop
- Interfaz moderna con gradientes
- Animaciones suaves
- UX optimizada

## Uso

1. **Registro**: Crea una nueva cuenta con nombre, email y contraseña
2. **Login**: Inicia sesión con tus credenciales
3. **Dashboard**: Accede a tu panel personal
4. **Perfil**: Gestiona tu información personal

## Desarrollo

### Estructura de Base de Datos

```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Variables de Entorno

- `PORT`: Puerto del servidor (default: 3000)
- `JWT_SECRET`: Clave secreta para JWT
- `DB_HOST`: Host de MySQL (default: localhost)
- `DB_NAME`: Nombre de la base de datos (default: webprojectdb)
- `DB_USER`: Usuario de MySQL (default: root)
- `DB_PASSWORD`: Contraseña de MySQL (default: vacío)
- `DB_PORT`: Puerto de MySQL (default: 3306)


## Solución de Problemas

1. **Error de conexión**: Verifica que el servidor esté corriendo
2. **Token inválido**: Haz logout y vuelve a iniciar sesión
3. **Base de datos**: Verifica que MySQL esté corriendo en XAMPP y las credenciales sean correctas
4. **Error de conexión MySQL**: Verifica que el usuario tenga permisos en la base de datos
5. **Puerto ocupado**: Cambia el puerto en las variables de entorno si 3306 está ocupado

