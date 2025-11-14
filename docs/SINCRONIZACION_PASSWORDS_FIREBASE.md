# 🔐 Sincronización de Contraseñas de Firebase a MySQL

## 📋 Descripción

Este sistema permite sincronizar usuarios de Firebase Realtime Database a MySQL, incluyendo sus contraseñas, para que puedan iniciar sesión en el sistema web usando las mismas credenciales.

## 🔄 Cómo Funciona

### 1. Lectura de Datos desde Firebase

Cuando se sincronizan usuarios desde Firebase (`services/firebaseAdmin.js`), el sistema ahora lee el campo `password` de los datos del usuario en Firebase Realtime Database:

```javascript
// En Firebase Realtime Database, la estructura del usuario debe incluir:
{
  "users": {
    "uid_del_usuario": {
      "email": "usuario@ejemplo.com",
      "name": "Nombre del Usuario",
      "password": "contraseña_del_usuario",  // ← Campo de contraseña
      "role": "estudiante",
      // ... otros campos
    }
  }
}
```

### 2. Sincronización a MySQL

El endpoint `/api/roles/all` (accesible solo para administradores) realiza la sincronización automática:

**Opciones de contraseña al sincronizar:**

1. **Si Firebase tiene el campo `password`**: Se usa esa contraseña directamente
2. **Si no existe el campo `password` en Firebase**: Se genera una contraseña predeterminada basada en el email
   - Formato: `[primeros 6 caracteres del email]123`
   - Ejemplo: Para `usuario@ejemplo.com` → contraseña: `usuari123`

### 3. Inicio de Sesión

Los usuarios sincronizados pueden iniciar sesión en `/login.html` usando:
- **Email**: El mismo email que tienen en Firebase
- **Contraseña**: 
  - La contraseña guardada en Firebase (si existe)
  - O la contraseña predeterminada generada (primeros 6 caracteres del email + "123")

## 🔧 Cambio de Contraseña

Los usuarios pueden cambiar su contraseña usando el endpoint:

**POST** `/api/auth/change-password`

```json
{
  "currentPassword": "contraseña_actual",
  "newPassword": "nueva_contraseña"
}
```

## 📝 Ejemplo de Uso

### Paso 1: Guardar Contraseña en Firebase

Desde la aplicación móvil o admin de Firebase, asegúrate de que los usuarios tengan un campo `password`:

```javascript
// Firebase Realtime Database
firebase.database().ref(`users/${userId}`).set({
  email: "juan@ejemplo.com",
  name: "Juan Pérez",
  password: "miPassword123",  // Contraseña que el usuario usará para login
  role: "estudiante"
});
```

### Paso 2: Sincronizar a MySQL

Los administradores acceden al panel de administración (`/admin`) y la sincronización ocurre automáticamente al cargar la lista de usuarios.

### Paso 3: Iniciar Sesión

El usuario puede iniciar sesión en el sistema web:
- Email: `juan@ejemplo.com`
- Contraseña: `miPassword123`

## ⚠️ Consideraciones de Seguridad

### Importante:
- **No es recomendable guardar contraseñas en texto plano en Firebase Realtime Database**
- Esta implementación asume que ya tienes contraseñas guardadas en Firebase
- Al sincronizar a MySQL, las contraseñas se hashean automáticamente con bcrypt (10 rondas)
- Las contraseñas nunca se envían en texto plano por la red (siempre hasheadas)

### Recomendaciones:
1. Si es posible, usa Firebase Authentication en lugar de guardar contraseñas manualmente
2. Si debes guardar contraseñas en Firebase, considera hashearlas antes
3. Informa a los usuarios sobre la opción de cambiar su contraseña después del primer login
4. Implementa políticas de contraseñas seguras (longitud mínima, complejidad, etc.)

## 🔑 Credenciales Predeterminadas

Si un usuario de Firebase no tiene campo `password`, se genera automáticamente:

| Email de Firebase | Contraseña Generada |
|-------------------|---------------------|
| usuario@ejemplo.com | `usuari123` |
| estudiante@gmail.com | `estudi123` |
| profesor@escuela.edu | `profes123` |
| admin@sistema.com | `admin123` |

**Los usuarios deben cambiar esta contraseña después del primer inicio de sesión.**

## 🛠️ Archivos Modificados

1. **`services/firebaseAdmin.js`**: Lee el campo `password` de Firebase
2. **`routes/roles.js`**: Implementa la lógica de sincronización con contraseñas
3. **`routes/auth.js`**: Añade endpoint para cambio de contraseña

## 📚 Endpoints Relacionados

| Endpoint | Método | Descripción | Autenticación |
|----------|--------|-------------|---------------|
| `/api/auth/login` | POST | Iniciar sesión | Pública |
| `/api/auth/change-password` | POST | Cambiar contraseña | Token requerido |
| `/api/roles/all` | GET | Sincronizar usuarios de Firebase | Admin requerido |

## 🧪 Pruebas

### Probar Sincronización:
1. Crear un usuario en Firebase con campo `password`
2. Acceder como admin a `/admin`
3. Verificar que el usuario aparece en la lista
4. Intentar login con las credenciales de Firebase

### Probar Contraseña Predeterminada:
1. Crear un usuario en Firebase sin campo `password`
2. Sincronizar desde el panel de admin
3. Intentar login con: email del usuario + contraseña generada (primeros 6 caracteres + "123")

### Probar Cambio de Contraseña:
1. Iniciar sesión con un usuario
2. Hacer POST a `/api/auth/change-password` con el token JWT
3. Intentar login con la nueva contraseña

## ❓ FAQ

### ¿Qué pasa si Firebase no tiene contraseñas guardadas?
El sistema genera automáticamente una contraseña basada en el email (primeros 6 caracteres + "123").

### ¿Las contraseñas se guardan en texto plano?
No. Aunque Firebase las tenga en texto plano, al sincronizar a MySQL se hashean con bcrypt.

### ¿Puedo cambiar el formato de la contraseña predeterminada?
Sí, modifica la línea 177 en `routes/roles.js`:
```javascript
password = emailPrefix.substring(0, 6) + '123';
```

### ¿Cómo notificar a los usuarios su contraseña generada?
Puedes implementar un endpoint que envíe un email al usuario con su contraseña temporal, o mostrar un mensaje en el panel de administración.

## 🔄 Flujo Completo

```
┌─────────────────┐
│  Firebase       │
│  Realtime DB    │
│  - email        │
│  - name         │
│  - password (*)│
└────────┬────────┘
         │
         │ Sincronización
         │ GET /api/roles/all
         ▼
┌─────────────────┐
│  MySQL          │
│  - email        │
│  - name         │
│  - password     │ ← Hasheado con bcrypt
│    (hasheado)   │
└────────┬────────┘
         │
         │ Login
         │ POST /api/auth/login
         ▼
┌─────────────────┐
│  Usuario        │
│  Autenticado    │
│  con JWT token  │
└─────────────────┘
```

(*) Campo opcional en Firebase

## 📞 Soporte

Para más información sobre el sistema de roles y autenticación, consulta:
- `docs/SISTEMA_ROLES_DOCUMENTACION.md`
- `docs/IMPLEMENTACION_COMPLETADA.md`

