# 🔐 Sistema de Autenticación con SHA-256

## 📋 Resumen

El sistema web utiliza **SHA-256** para el hashing de contraseñas, compatible con la aplicación móvil Firebase.

## 🔧 Configuración

### Backend (Node.js)

```javascript
// models/User.js
const crypto = require('crypto');

// Hashear contraseña
const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

// Comparar contraseña
const hashedCandidate = crypto.createHash('sha256').update(candidatePassword).digest('hex');
return hashedCandidate === this.password;
```

## 🔄 Sincronización con Firebase

El sistema sincroniza usuarios de Firebase Realtime Database a MySQL:

### Reglas de Sincronización

1. **Usuario con `passwordHash` en Firebase**:
   - Copia el hash SHA-256 directamente a MySQL
   - NO modifica ni vuelve a hashear

2. **Usuario con `pinHash` (sin passwordHash)**:
   - Usa el pinHash como contraseña
   - NO modifica ni vuelve a hashear

3. **Usuario sin hash**:
   - NO se sincroniza
   - Se omite automáticamente

### Logs de Sincronización

```bash
✅ [Sync] usuario@ejemplo.com - Usando passwordHash de Firebase directamente
✅ [Sync] otro@ejemplo.com - Usando pinHash de Firebase directamente
❌ [Sync] sinpass@ejemplo.com - Sin passwordHash ni pinHash, OMITIENDO
```

## 📱 Estructura en Firebase

```json
{
  "users": {
    "uid_usuario": {
      "email": "usuario@ejemplo.com",
      "name": "Nombre Usuario",
      "passwordHash": "9654b7bdfaf4f467e3fd4cd03f163ccd9fda5a90772e0f9b24687a6e0b60304b",
      "pinHash": "483029d526219f816e8e8f6a9de07b422633dba180ffc26faac22862a017519f"
    }
  }
}
```

## 🔑 Login

Los usuarios pueden hacer login con:
- Email de Firebase
- Contraseña original (la que genera el passwordHash o pinHash)

```javascript
// Ejemplo de login
POST /api/auth/login
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña_original"
}
```

## ⚠️ Consideraciones de Seguridad

### SHA-256 vs Bcrypt

**SHA-256**:
- ✅ Compatible con Firebase
- ✅ Mismo hash en ambos sistemas
- ⚠️ Menos seguro que bcrypt (rápido = vulnerable a fuerza bruta)
- ⚠️ Sin salt automático (misma password → mismo hash)

**Recomendaciones**:
1. Contraseñas fuertes (10+ caracteres, mayúsculas, números, símbolos)
2. Implementar rate limiting en login
3. Usar HTTPS siempre
4. Considerar 2FA en el futuro

## 🚀 Endpoints de Autenticación

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/auth/register` | POST | Registrar nuevo usuario |
| `/api/auth/login` | POST | Iniciar sesión |
| `/api/auth/change-password` | POST | Cambiar contraseña |
| `/api/auth/verify` | GET | Verificar token JWT |
| `/api/auth/refresh` | POST | Renovar tokens |

## 🧪 Pruebas

### Verificar Sincronización

1. Eliminar usuarios de Firebase en MySQL:
```sql
DELETE FROM users WHERE firebase_uid IS NOT NULL;
```

2. Reiniciar servidor y sincronizar desde `/admin`

3. Verificar logs del servidor

4. Probar login con contraseña original

### Verificar Hash en MySQL

```sql
SELECT 
    email,
    LENGTH(password) as longitud,
    LEFT(password, 20) as hash_inicio
FROM users
WHERE firebase_uid IS NOT NULL;
```

**Resultado esperado**:
- Longitud: 64 caracteres
- Hash_inicio: Caracteres hexadecimales (0-9, a-f)

## 📞 Troubleshooting

### Login falla (401)
- Verificar que el hash en MySQL coincide con Firebase
- Verificar logs del servidor para ver si es usuario no encontrado o password incorrecta
- Probar con usuario de prueba conocido

### Usuario no se sincroniza
- Verificar que tiene `passwordHash` o `pinHash` en Firebase
- Ver logs: "OMITIENDO" indica que no tiene hash válido
- Agregar hash en Firebase manualmente si es necesario

## 📚 Documentación Adicional

- `SINCRONIZACION_PASSWORDS_FIREBASE.md` - Detalles de sincronización
- `SISTEMA_ROLES_DOCUMENTACION.md` - Sistema de roles
- `SWAGGER_DOCUMENTATION.md` - Documentación API completa

