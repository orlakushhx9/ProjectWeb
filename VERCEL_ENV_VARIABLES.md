# Variables de Entorno para Vercel

Para que tu aplicación funcione correctamente en Vercel, necesitas configurar las siguientes variables de entorno en el panel de Vercel.

## 📋 Cómo Agregar Variables en Vercel

1. Ve a tu proyecto en Vercel: https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** → **Environment Variables**
4. Agrega cada variable una por una
5. **IMPORTANTE**: Marca todas las variables para los 3 entornos:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

## 🔐 Variables Requeridas

### 1. Base de Datos MySQL (Railway)

```
DB_HOST=metro.proxy.rlwy.net
DB_PORT=39347
DB_NAME=railway
DB_USER=root
DB_PASSWORD=OLcbGoPfYCZFJnXkLdtDjoMoJsZBEBuh
```

### 2. JWT (Autenticación)

```
JWT_SECRET=eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiIsImtpZCI6ImU0NmYyMThiNGY1ODU1NDE1YTc2ZTZhYmUwOWJiNWVmIn0.e30.sc-mE36Rjm6W1b0iHHQUkleFobo_6GifD7KHdEaStV8RWLHF3lmt9Lq9p8sCmmyy8aRG_GJY2eKvl5SXCQfZhA
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
JWT_ALGORITHM=HS256
```

### 3. Firebase Admin SDK

```
FIREBASE_DATABASE_URL=https://gestusproject-default-rtdb.firebaseio.com
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"gestusproject",...}
```

**⚠️ IMPORTANTE para FIREBASE_SERVICE_ACCOUNT_JSON:**
- Debes convertir tu archivo `serviceAccountKey.json` a una sola línea JSON
- Ejecuta: `npm run convert-firebase` (si tienes el script)
- O copia todo el contenido del JSON en una sola línea
- **NO** uses saltos de línea, debe ser un string JSON completo

### 4. Variables Opcionales (Vercel las maneja automáticamente)

```
NODE_ENV=production
PORT=5000
```

## 📝 Pasos Detallados

### Paso 1: Obtener FIREBASE_SERVICE_ACCOUNT_JSON

Si tienes el archivo `serviceAccountKey.json`:

1. Abre el archivo en un editor
2. Copia TODO el contenido
3. Conviértelo a una sola línea (sin saltos de línea)
4. Pégalo en Vercel como valor de `FIREBASE_SERVICE_ACCOUNT_JSON`

**Ejemplo de formato correcto:**
```
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"gestusproject","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

### Paso 2: Agregar Variables en Vercel

1. Ve a: https://vercel.com/[tu-usuario]/[tu-proyecto]/settings/environment-variables
2. Haz clic en **Add New**
3. Agrega cada variable:
   - **Key**: `DB_HOST`
   - **Value**: `metro.proxy.rlwy.net`
   - Marca: Production, Preview, Development
4. Repite para todas las variables

### Paso 3: Redesplegar

Después de agregar todas las variables:

1. Ve a la pestaña **Deployments**
2. Haz clic en los 3 puntos (⋯) del último deployment
3. Selecciona **Redeploy**
4. O simplemente haz un nuevo push a tu repositorio

## ✅ Verificación

Después de configurar las variables y redesplegar, verifica que todo funcione:

1. Abre tu aplicación en Vercel
2. Intenta iniciar sesión
3. Revisa los logs en Vercel (Deployments → [tu-deployment] → Functions → [función])
4. Si hay errores de conexión a la BD, verifica que las variables de MySQL estén correctas

## 🔍 Troubleshooting

### Error: "Cannot connect to MySQL"
- Verifica que `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` estén correctos
- Asegúrate de que Railway permita conexiones externas
- Verifica que el firewall de Railway no esté bloqueando Vercel

### Error: "FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON"
- Asegúrate de que el JSON esté en una sola línea
- Verifica que no haya comillas dobles dentro del JSON que necesiten escaparse
- Usa el script `npm run convert-firebase` si está disponible

### Error: "JWT_SECRET is not defined"
- Verifica que todas las variables JWT estén configuradas
- Asegúrate de que estén marcadas para Production

## 📚 Referencias

- [Documentación de Vercel sobre Variables de Entorno](https://vercel.com/docs/concepts/projects/environment-variables)
- [Railway MySQL Connection](https://docs.railway.app/databases/mysql)

