# Guía de Despliegue

Este documento explica cómo desplegar el proyecto en Vercel y usando Docker.

## 📋 Requisitos Previos

- Node.js 18 o superior
- Cuenta en Vercel (para despliegue en Vercel)
- Docker y Docker Compose (para despliegue con Docker)
- Credenciales de MySQL de Railway
- Credenciales de Firebase (serviceAccountKey.json)

## 🔧 Configuración de Variables de Entorno

### Variables Necesarias

1. **MySQL (Railway)**
   - `DB_HOST=metro.proxy.rlwy.net`
   - `DB_PORT=39347`
   - `DB_NAME=railway`
   - `DB_USER=root`
   - `DB_PASSWORD=OLcbGoPfYCZFJnXkLdtDjoMoJsZBEBuh`

2. **JWT**
   - `JWT_SECRET` - Clave secreta para JWT
   - `JWT_EXPIRES_IN=24h`
   - `JWT_REFRESH_EXPIRES_IN=7d`
   - `JWT_ALGORITHM=HS256`

3. **Firebase**
   - `FIREBASE_DATABASE_URL=https://gestusproject-default-rtdb.firebaseio.com`
   - `FIREBASE_SERVICE_ACCOUNT_JSON` - Contenido completo del archivo `serviceAccountKey.json` como string JSON

### Convertir serviceAccountKey.json a Variable de Entorno

Para obtener el valor de `FIREBASE_SERVICE_ACCOUNT_JSON`, necesitas:

1. Abrir el archivo `serviceAccountKey.json`
2. Copiar todo su contenido
3. Convertirlo a una sola línea (sin saltos de línea)
4. Escapar las comillas dobles si es necesario
5. Usar ese valor como variable de entorno

**Ejemplo:**
```bash
# El archivo JSON original:
{
  "type": "service_account",
  "project_id": "gestusproject",
  ...
}

# Debe convertirse a:
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"gestusproject",...}
```

## 🚀 Despliegue en Vercel

### Opción 1: Despliegue desde GitHub (Recomendado)

1. **Sube tu código a GitHub**
   ```bash
   git init
   git add .
   git commit -m "Preparado para Vercel"
   git remote add origin <tu-repositorio-git>
   git push -u origin main
   ```

2. **Conecta con Vercel**
   - Ve a [vercel.com](https://vercel.com)
   - Inicia sesión con GitHub
   - Haz clic en "New Project"
   - Importa tu repositorio

3. **Configura las Variables de Entorno en Vercel**
   - En la configuración del proyecto, ve a "Environment Variables"
   - Agrega todas las variables necesarias:
     - `DB_HOST`
     - `DB_PORT`
     - `DB_NAME`
     - `DB_USER`
     - `DB_PASSWORD`
     - `JWT_SECRET`
     - `JWT_EXPIRES_IN`
     - `JWT_REFRESH_EXPIRES_IN`
     - `JWT_ALGORITHM`
     - `FIREBASE_DATABASE_URL`
     - `FIREBASE_SERVICE_ACCOUNT_JSON` (⚠️ IMPORTANTE: Todo el JSON en una línea)
     - `NODE_ENV=production`

4. **Despliega**
   - Vercel detectará automáticamente el `vercel.json`
   - El despliegue comenzará automáticamente

### Opción 2: Despliegue desde CLI

1. **Instala Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Inicia sesión**
   ```bash
   vercel login
   ```

3. **Despliega**
   ```bash
   vercel
   ```

4. **Configura las variables de entorno**
   ```bash
   vercel env add DB_HOST
   vercel env add DB_PORT
   vercel env add DB_NAME
   vercel env add DB_USER
   vercel env add DB_PASSWORD
   vercel env add JWT_SECRET
   vercel env add FIREBASE_DATABASE_URL
   vercel env add FIREBASE_SERVICE_ACCOUNT_JSON
   # ... etc
   ```

5. **Despliega a producción**
   ```bash
   vercel --prod
   ```

## 🐳 Despliegue con Docker

### Desarrollo Local con Docker

1. **Crea un archivo `.env` o usa `config.env`**
   ```bash
   cp config.env .env
   # Edita .env con tus valores
   ```

2. **Construye y ejecuta el contenedor**
   ```bash
   docker-compose up --build
   ```

3. **Accede a la aplicación**
   - Abre `http://localhost:5000`

### Producción con Docker

1. **Construye la imagen**
   ```bash
   docker build -t gestus-web .
   ```

2. **Ejecuta el contenedor**
   ```bash
   docker run -d \
     --name gestus-web \
     -p 5000:5000 \
     -e DB_HOST=metro.proxy.rlwy.net \
     -e DB_PORT=39347 \
     -e DB_NAME=railway \
     -e DB_USER=root \
     -e DB_PASSWORD=OLcbGoPfYCZFJnXkLdtDjoMoJsZBEBuh \
     -e JWT_SECRET=tu_jwt_secret \
     -e FIREBASE_DATABASE_URL=https://gestusproject-default-rtdb.firebaseio.com \
     -e FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}' \
     gestus-web
   ```

   O usando un archivo `.env`:
   ```bash
   docker run -d \
     --name gestus-web \
     -p 5000:5000 \
     --env-file config.env \
     gestus-web
   ```

## ⚠️ Notas Importantes

### Firebase Service Account JSON

- **NO** uses `FIREBASE_SERVICE_ACCOUNT_PATH` en producción
- **SÍ** usa `FIREBASE_SERVICE_ACCOUNT_JSON` con el contenido completo del JSON
- El JSON debe estar en una sola línea sin saltos de línea
- Escapa las comillas dobles correctamente

### Base de Datos MySQL

- La conexión usa el host público de Railway: `metro.proxy.rlwy.net:39347`
- Asegúrate de que la base de datos `railway` exista
- Verifica que las credenciales sean correctas

### Vercel

- Vercel funciona con funciones serverless
- El archivo `api/index.js` actúa como handler serverless
- Los archivos estáticos se sirven desde la carpeta `public`
- Las variables de entorno deben configurarse en el dashboard de Vercel

## 🔍 Verificación

Después del despliegue, verifica:

1. **API funcionando**: `https://tu-dominio.vercel.app/api/auth/login`
2. **Frontend funcionando**: `https://tu-dominio.vercel.app/`
3. **Base de datos conectada**: Revisa los logs del servidor
4. **Firebase conectado**: Revisa los logs del servidor

## 🐛 Solución de Problemas

### Error: "FIREBASE_SERVICE_ACCOUNT_JSON no contiene un JSON válido"
- Verifica que el JSON esté en una sola línea
- Asegúrate de escapar las comillas correctamente
- Prueba parsear el JSON manualmente

### Error: "No se pudo establecer conexión con la base de datos"
- Verifica que las credenciales de MySQL sean correctas
- Asegúrate de que el host y puerto sean accesibles
- Revisa los logs de Railway

### Error: "Cannot find module"
- Ejecuta `npm install` antes de construir Docker
- Verifica que `package.json` tenga todas las dependencias

## 📞 Soporte

Si encuentras problemas, revisa:
- Los logs de Vercel en el dashboard
- Los logs de Docker: `docker logs gestus-web`
- La configuración de variables de entorno

