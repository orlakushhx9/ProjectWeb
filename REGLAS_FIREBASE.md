# 🔥 Reglas de Firebase Realtime Database

## Reglas Actuales

```json
{
  "rules": {
    ".read": true,
    ".write": "auth != null && now < 1764037200000",
    "users": {
      "$uid": {
        ".read": true,
        ".write": "auth.uid === $uid || auth.token.role === 'admin'"
      }
    },
    "gestureAttempts": {
      "$uid": {
        ".read": true,
        ".write": "auth.uid === $uid || auth.token.role === 'admin'",
        "$gestureId": {
          "$attemptId": {
            ".validate": "newData.hasChildren(['gestureId','detectedLabel','score','percentage','isCorrect','timestamp'])"
          }
        }
      }
    }
  }
}
```

## ✅ Análisis de las Reglas

### Lectura (`.read`)
- ✅ **Raíz**: `.read": true` - Permite lectura pública de toda la base de datos
- ✅ **users/$uid**: `.read": true` - Permite lectura pública de usuarios
- ✅ **gestureAttempts/$uid**: `.read": true` - Permite lectura pública de gestos

**Conclusión**: Las reglas de lectura están correctas y permiten acceso público.

### Escritura (`.write`)
- ⚠️ **Raíz**: Requiere autenticación (`auth != null`) y tiene una fecha de expiración
- ✅ **users/$uid**: Permite escritura si el usuario es el propietario o es admin
- ✅ **gestureAttempts/$uid**: Permite escritura si el usuario es el propietario o es admin

## 🔑 Importante: Firebase Admin SDK

**El Firebase Admin SDK IGNORA las reglas de seguridad**. Tiene acceso completo a la base de datos independientemente de las reglas.

Si el Admin SDK no puede leer los datos, el problema NO son las reglas, sino:
1. ❌ Firebase Admin no está inicializado correctamente
2. ❌ Las credenciales (`FIREBASE_SERVICE_ACCOUNT_JSON`) no están configuradas
3. ❌ Hay un error en la conexión a Firebase

## 🔧 Solución

### 1. Verificar Configuración en Vercel

Asegúrate de tener estas variables de entorno:

```
FIREBASE_DATABASE_URL=https://gestusproject-default-rtdb.firebaseio.com
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

### 2. Verificar los Logs de Vercel

1. Ve a Vercel → tu proyecto → Deployments
2. Selecciona el último deployment
3. Haz clic en "View Function Logs"
4. Busca mensajes que empiecen con `[Firebase Admin]`

Deberías ver:
```
[Firebase Admin] Iniciando inicialización...
[Firebase Admin] FIREBASE_DATABASE_URL: Definido
[Firebase Admin] FIREBASE_SERVICE_ACCOUNT_JSON: Definido (XXXX caracteres)
[Firebase Admin] ✅ Inicializado usando FIREBASE_SERVICE_ACCOUNT_JSON
[Firebase Admin] ✅ Firebase Admin inicializado correctamente
[Firebase Admin] Obteniendo todos los gestureAttempts...
[Firebase Admin] Datos obtenidos: { totalUsers: X, users: [...] }
[Firebase Admin] ✅ Total de usuarios con gestos: X
```

### 3. Probar la Conexión

En desarrollo, puedes probar la conexión con:
```
GET http://localhost:5000/api/test-firebase
```

Esto te mostrará:
- Si las variables de entorno están configuradas
- Si Firebase Admin se inicializa correctamente
- Cuántos usuarios y gestos se pueden leer

### 4. Verificar que Haya Datos en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto `gestusproject`
3. Ve a "Realtime Database"
4. Verifica que existan datos en:
   - `/gestureAttempts` - Debería tener datos de usuarios
   - `/users` - Debería tener datos de usuarios

## 📝 Notas

1. **Las reglas NO afectan al Admin SDK**: El Admin SDK tiene privilegios administrativos completos
2. **Las reglas solo afectan a clientes**: Navegadores, apps móviles, etc.
3. **Si el Admin SDK no puede leer**: El problema es de configuración, no de reglas

## 🐛 Si Sigue Sin Funcionar

1. **Verifica los logs de Vercel** - Busca errores específicos
2. **Verifica las variables de entorno** - Asegúrate de que `FIREBASE_SERVICE_ACCOUNT_JSON` esté completo
3. **Prueba la ruta de test** - `/api/test-firebase` te dará información detallada
4. **Verifica que haya datos en Firebase** - Si no hay datos, no hay nada que leer

