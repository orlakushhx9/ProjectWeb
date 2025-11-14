# 🚀 Guía Final de Despliegue en Vercel

## ✅ Cambios Realizados para Producción

### 1. URLs Dinámicas
- ✅ Creado `public/js/config.js` que detecta automáticamente si está en desarrollo o producción
- ✅ Actualizado `script.js` y `dashboard.js` para usar URLs dinámicas
- ✅ Agregado `config.js` a todos los archivos HTML

### 2. Configuración CORS
- ✅ CORS configurado para permitir todas las peticiones en producción
- ✅ Configurado tanto en `server.js` como en `api/index.js`

### 3. Eliminación de Referencias Locales
- ✅ Eliminadas todas las referencias a `localhost:5000` en mensajes de error
- ✅ El código ahora funciona tanto en desarrollo como en producción

## 📋 Checklist Pre-Despliegue

### ✅ 1. Variables de Entorno en Vercel

Asegúrate de tener configuradas **TODAS** estas variables en Vercel:

#### MySQL (Railway)
```
DB_HOST = metro.proxy.rlwy.net
DB_PORT = 39347
DB_NAME = railway
DB_USER = root
DB_PASSWORD = OLcbGoPfYCZFJnXkLdtDjoMoJsZBEBuh
```

#### JWT
```
JWT_SECRET = eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiIsImtpZCI6ImU0NmYyMThiNGY1ODU1NDE1YTc2ZTZhYmUwOWJiNWVmIn0.e30.sc-mE36Rjm6W1b0iHHQUkleFobo_6GifD7KHdEaStV8RWLHF3lmt9Lq9p8sCmmyy8aRG_GJY2eKvl5SXCQfZhA
JWT_EXPIRES_IN = 24h
JWT_REFRESH_EXPIRES_IN = 7d
JWT_ALGORITHM = HS256
```

#### Firebase
```
FIREBASE_DATABASE_URL = https://gestusproject-default-rtdb.firebaseio.com
FIREBASE_SERVICE_ACCOUNT_JSON = {"type":"service_account","project_id":"gestusproject",...}
```

#### Entorno
```
NODE_ENV = production
```

### ✅ 2. Verificar Archivos en GitHub

Asegúrate de que estos archivos estén en tu repositorio:
- ✅ `api/index.js` - Handler serverless para Vercel
- ✅ `vercel.json` - Configuración de Vercel
- ✅ `public/js/config.js` - Configuración de URLs dinámicas
- ✅ Todos los archivos HTML actualizados con `config.js`

### ✅ 3. Subir Cambios a GitHub

```bash
git add .
git commit -m "Configuración para producción - URLs dinámicas y CORS"
git push origin master
```

## 🚀 Pasos para Desplegar en Vercel

### Opción 1: Desde el Dashboard de Vercel

1. **Ve a [vercel.com](https://vercel.com)** e inicia sesión
2. **Haz clic en "Add New Project"**
3. **Importa tu repositorio** `orlz09/prueba`
4. **Configura el proyecto:**
   - Framework Preset: **Express** (debería detectarse automáticamente)
   - Root Directory: `./` (raíz del proyecto)
   - Build Command: (dejar vacío, Vercel lo detecta automáticamente)
   - Output Directory: (dejar vacío)

5. **Configura las Variables de Entorno:**
   - Ve a la sección "Environment Variables"
   - Agrega todas las variables listadas arriba
   - **IMPORTANTE**: Para `FIREBASE_SERVICE_ACCOUNT_JSON`, pega el JSON completo en una sola línea

6. **Haz clic en "Deploy"**

### Opción 2: Desde la CLI

```bash
# Instalar Vercel CLI (si no lo tienes)
npm i -g vercel

# Iniciar sesión
vercel login

# Desplegar
vercel

# Configurar variables de entorno
vercel env add DB_HOST
vercel env add DB_PORT
# ... (repetir para cada variable)

# Desplegar a producción
vercel --prod
```

## 🔍 Verificación Post-Despliegue

### 1. Verificar que el sitio carga
- Abre la URL de Vercel (ej: `https://prueba.vercel.app`)
- Deberías ver la página de inicio o login

### 2. Verificar la API
- Abre: `https://tu-proyecto.vercel.app/api-docs` (Swagger)
- O prueba: `https://tu-proyecto.vercel.app/api/auth/login` (POST)

### 3. Verificar la consola del navegador
- Abre las herramientas de desarrollador (F12)
- Ve a la pestaña "Console"
- Deberías ver: `API Base URL: https://tu-proyecto.vercel.app/api`
- Deberías ver: `Entorno: Producción`

### 4. Probar Login/Registro
- Intenta hacer login o registro
- Verifica que las peticiones se hagan a la URL correcta
- Revisa la pestaña "Network" para ver las peticiones

## 🐛 Solución de Problemas

### Error: "Cannot find module"
- **Solución**: Verifica que `package.json` tenga todas las dependencias
- Ejecuta `npm install` localmente y sube `package-lock.json`

### Error: "Database connection failed"
- **Solución**: Verifica las variables de entorno de MySQL en Vercel
- Asegúrate de que `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` estén correctas

### Error: "Firebase initialization failed"
- **Solución**: Verifica que `FIREBASE_SERVICE_ACCOUNT_JSON` esté completo
- Debe ser el JSON completo en una sola línea, sin saltos de línea

### Error: "CORS policy"
- **Solución**: Ya está configurado, pero si persiste, verifica que `api/index.js` tenga la configuración de CORS correcta

### La página carga pero las peticiones fallan
- **Solución**: 
  1. Abre la consola del navegador (F12)
  2. Ve a la pestaña "Network"
  3. Intenta hacer login/registro
  4. Revisa qué URL está usando (debería ser `https://tu-proyecto.vercel.app/api/...`)
  5. Verifica que `config.js` se esté cargando correctamente

## 📝 Notas Importantes

1. **URLs Dinámicas**: El código ahora detecta automáticamente si está en desarrollo o producción
   - Desarrollo: `http://localhost:5000/api`
   - Producción: `https://tu-proyecto.vercel.app/api`

2. **CORS**: Configurado para permitir todas las peticiones en producción

3. **Variables de Entorno**: Todas las configuraciones sensibles están en variables de entorno

4. **Sin Dependencias Locales**: El proyecto ya no necesita archivos locales para funcionar

## 🎉 ¡Listo!

Una vez desplegado, tu aplicación estará disponible en:
- **URL Principal**: `https://tu-proyecto.vercel.app`
- **API**: `https://tu-proyecto.vercel.app/api`
- **Swagger**: `https://tu-proyecto.vercel.app/api-docs`

¡Tu proyecto está listo para producción! 🚀

