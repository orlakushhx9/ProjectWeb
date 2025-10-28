
Tu API ahora tiene documentación interactiva completa con Swagger UI.

### 📍 Acceso a la Documentación

**URL de Swagger UI:** `http://localhost:3000/api-docs`

### 🎯 Características Implementadas

#### ✅ **Configuración Completa**
- **OpenAPI 3.0.0** - Estándar moderno de documentación
- **Swagger UI** - Interfaz interactiva para probar endpoints
- **JSDoc** - Documentación integrada en el código

#### ✅ **Endpoints Documentados**

**🔐 Autenticación (`/api/auth/`)**
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Login de usuario
- `GET /api/auth/verify` - Verificar token
- `POST /api/auth/refresh` - Renovar tokens
- `POST /api/auth/logout` - Logout

**👤 Usuarios (`/api/users/`)**
- `GET /api/users/profile` - Obtener perfil
- `PUT /api/users/profile` - Actualizar perfil
- `DELETE /api/users/profile` - Eliminar cuenta

#### ✅ **Esquemas de Datos**
- **User** - Modelo de usuario
- **AuthResponse** - Respuesta de autenticación
- **ErrorResponse** - Respuesta de errores

#### ✅ **Autenticación JWT**
- Configuración de Bearer Token
- Endpoints protegidos marcados
- Ejemplos de uso de tokens

### 🛠️ Cómo Usar Swagger UI

#### **1. Acceder a la Documentación**
```
http://localhost:3000/api-docs
```

#### **2. Probar Endpoints**
1. **Expandir** el endpoint que quieres probar
2. **Hacer clic** en "Try it out"
3. **Completar** los parámetros requeridos
4. **Ejecutar** con "Execute"

#### **3. Autenticación**
1. **Registrar** o **hacer login** para obtener un token
2. **Copiar** el `accessToken` de la respuesta
3. **Hacer clic** en "Authorize" (botón verde)
4. **Pegar** el token: `Bearer tu_token_aqui`
5. **Probar** endpoints protegidos

### 📋 Ejemplos de Uso

#### **Registro de Usuario**
```json
POST /api/auth/register
{
  "name": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "password": "miPassword123"
}
```

#### **Login de Usuario**
```json
POST /api/auth/login
{
  "email": "juan@ejemplo.com",
  "password": "miPassword123"
}
```

#### **Obtener Perfil (con token)**
```
GET /api/users/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 🔧 Configuración Técnica

#### **Archivos Modificados**
- `server.js` - Configuración principal de Swagger
- `routes/auth.js` - Documentación de endpoints de autenticación
- `routes/users.js` - Documentación de endpoints de usuarios

#### **Dependencias Instaladas**
```json
{
  "swagger-ui-express": "^5.0.0",
  "swagger-jsdoc": "^6.2.8"
}
```

#### **Estructura de Documentación**
```javascript
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión de usuario
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Login exitoso
 */
```

### 🎉 Beneficios

- ✅ **Documentación Automática** - Se actualiza con el código
- ✅ **Pruebas Interactivas** - Probar endpoints directamente
- ✅ **Ejemplos Claros** - Parámetros y respuestas documentados
- ✅ **Autenticación Integrada** - Manejo fácil de tokens JWT
- ✅ **Estándar de la Industria** - OpenAPI 3.0.0

### 🚀 Próximos Pasos

1. **Probar** todos los endpoints en Swagger UI
2. **Compartir** la documentación con tu equipo
3. **Integrar** con herramientas de desarrollo
4. **Expandir** la documentación según necesidades

---

**¡Tu API ahora tiene documentación profesional y interactiva!** 🎉

