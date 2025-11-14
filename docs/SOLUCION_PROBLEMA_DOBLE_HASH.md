# 🔧 Solución al Problema de Doble Hash

## ❌ Problema Identificado

Cuando los usuarios se registran desde la **aplicación móvil**, las contraseñas se guardan en Firebase **ya hasheadas con bcrypt**. Al sincronizar estos usuarios a MySQL, el sistema estaba **hasheando nuevamente** la contraseña (doble hash), lo que impedía que los usuarios pudieran hacer login.

### Flujo del Problema:

```
App Móvil
   ↓
1. Usuario se registra con password: "miPassword123"
   ↓
2. App móvil hashea con bcrypt: "$2a$10$abcd1234..."
   ↓
3. Se guarda en Firebase: password: "$2a$10$abcd1234..."
   ↓
4. Sincronización a MySQL (PROBLEMA):
   - Lee: "$2a$10$abcd1234..."
   - Vuelve a hashear: "$2a$10$xyz789..." (hash del hash)
   ↓
5. Usuario intenta login:
   - Ingresa: "miPassword123"
   - Sistema compara con: "$2a$10$xyz789..." (hash del hash)
   - ❌ NO COINCIDE
```

## ✅ Solución Implementada

El sistema ahora **detecta automáticamente** si la contraseña que viene de Firebase ya está hasheada con bcrypt antes de sincronizar.

### Cómo Funciona:

```javascript
// Patrón de hashes bcrypt: empiezan con $2a$, $2b$ o $2y$
const bcryptPattern = /^\$2[aby]\$\d{2}\$/;
const isAlreadyHashed = bcryptPattern.test(password);

if (isAlreadyHashed) {
    // NO volver a hashear, insertar directamente
    // Guardar en MySQL tal cual está
} else {
    // Es texto plano, hashear normalmente
    // Usar User.create() que hashea automáticamente
}
```

### Flujo Correcto Ahora:

```
App Móvil
   ↓
1. Usuario se registra: "miPassword123"
   ↓
2. App móvil hashea: "$2a$10$abcd1234..."
   ↓
3. Firebase: password: "$2a$10$abcd1234..."
   ↓
4. Sincronización a MySQL (CORRECTO):
   - Lee: "$2a$10$abcd1234..."
   - Detecta: ✓ Ya está hasheada
   - Guarda: "$2a$10$abcd1234..." (sin modificar)
   ↓
5. Usuario hace login:
   - Ingresa: "miPassword123"
   - Sistema compara con: "$2a$10$abcd1234..."
   - ✅ COINCIDE
```

## 🎯 Escenarios Soportados

El sistema ahora maneja **3 escenarios diferentes**:

### Escenario 1: Contraseña Hasheada en Firebase (App Móvil)
```
Firebase: { password: "$2a$10$abcd..." }
         ↓
MySQL: Guarda el hash tal cual (NO vuelve a hashear)
         ↓
Login: Funciona con la contraseña original ✅
```

### Escenario 2: Contraseña en Texto Plano en Firebase
```
Firebase: { password: "password123" }
         ↓
MySQL: Hashea la contraseña (bcrypt)
         ↓
Login: Funciona con "password123" ✅
```

### Escenario 3: Sin Contraseña en Firebase
```
Firebase: { email: "usuario@ejemplo.com" }
         ↓
MySQL: Genera password: "usuari123"
         ↓
Login: Funciona con "usuari123" ✅
```

## 🔍 Cómo Verificar que Funciona

### 1. Ver los Logs en la Consola del Servidor

Cuando sincronices usuarios, verás en la consola:

```bash
[Sync] Usuario juan@ejemplo.com - Password YA HASHEADA
[Sync] Usuario maria@ejemplo.com - Password en texto plano
```

### 2. Verificar en la Base de Datos

Todas las contraseñas en MySQL deben empezar con `$2a$10$`, `$2b$10$` o `$2y$10$`:

```sql
SELECT id, email, 
       LEFT(password, 10) as password_prefix 
FROM users;

-- Resultado correcto:
-- email                | password_prefix
-- --------------------|----------------
-- juan@ejemplo.com    | $2a$10$abc
-- maria@ejemplo.com   | $2a$10$xyz
```

### 3. Probar Login

```bash
# Probar con la contraseña ORIGINAL de Firebase
POST http://localhost:5000/api/auth/login
{
  "email": "juan@ejemplo.com",
  "password": "laPasswordOriginal"  # NO el hash
}

# Debe retornar:
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

## 📋 Checklist de Verificación

Antes de declarar el problema resuelto, verifica:

- [ ] Los logs muestran si las passwords están hasheadas o no
- [ ] Los usuarios sincronizados desde Firebase aparecen en `/admin`
- [ ] Puedes hacer login con la contraseña ORIGINAL (no el hash)
- [ ] Las contraseñas en MySQL empiezan con `$2a$`, `$2b$` o `$2y$`
- [ ] No hay doble hash (la contraseña no es un hash de un hash)

## 🔧 Comandos de Diagnóstico

### Ver Usuarios Sincronizados:
```bash
# En el servidor Node.js, ver logs:
npm run dev

# Al cargar /admin, verás:
[Sync] Usuario juan@ejemplo.com - Password YA HASHEADA
[Sync] Usuario maria@ejemplo.com - Password en texto plano
```

### Verificar en MySQL:
```sql
-- Ver todos los usuarios y tipo de hash
SELECT 
    id,
    name,
    email,
    CASE 
        WHEN password LIKE '$2a$%' THEN 'bcrypt $2a'
        WHEN password LIKE '$2b$%' THEN 'bcrypt $2b'
        WHEN password LIKE '$2y$%' THEN 'bcrypt $2y'
        ELSE 'OTRO/PROBLEMA'
    END as password_type,
    firebase_uid,
    role
FROM users
ORDER BY id;
```

### Probar Login desde la Consola del Navegador:
```javascript
fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: 'tu_email@ejemplo.com',
        password: 'tu_password_original'  // NO el hash
    })
})
.then(r => r.json())
.then(d => console.log(d));
```

## 🚨 Solución de Problemas

### Problema: Todavía no puedo hacer login

**Causa Probable**: Los usuarios ya estaban sincronizados con doble hash antes de la corrección.

**Solución**:
1. Elimina los usuarios duplicados de MySQL:
```sql
-- Ver usuarios con firebase_uid
SELECT id, email, firebase_uid FROM users WHERE firebase_uid IS NOT NULL;

-- Eliminar usuarios sincronizados (CUIDADO: haz backup primero)
DELETE FROM users WHERE firebase_uid IS NOT NULL;
```

2. Vuelve a sincronizar desde el panel de admin (`/admin`)

3. Ahora intenta login nuevamente

### Problema: Los logs no aparecen

**Solución**: Asegúrate de estar ejecutando el servidor con `npm run dev` para ver los logs en la consola.

### Problema: La contraseña en MySQL no empieza con $2a$

**Causa**: La contraseña no se está hasheando correctamente.

**Solución**: 
1. Verifica que bcryptjs esté instalado:
```bash
npm list bcryptjs
```

2. Reinstala si es necesario:
```bash
npm install bcryptjs
```

## 📝 Notas Técnicas

### ¿Por qué bcrypt?
- bcrypt es un algoritmo de hashing diseñado para contraseñas
- Incluye un "salt" aleatorio automáticamente
- Es lento por diseño (previene ataques de fuerza bruta)
- El formato es: `$2a$10$saltsaltsaltsaltsalt.hashhashhashhashhashhash`

### Formato del Hash:
```
$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
│  │  │                          │
│  │  │                          └─ Hash (31 chars)
│  │  └─ Salt (22 chars)
│  └─ Cost factor (10 = 2^10 = 1024 rounds)
└─ Algoritmo (2a = bcrypt)
```

### Detección de Hash:
```javascript
// Regex para detectar hashes bcrypt
const bcryptPattern = /^\$2[aby]\$\d{2}\$/;

// Ejemplos que coinciden:
"$2a$10$..." ✓
"$2b$12$..." ✓
"$2y$08$..." ✓

// Ejemplos que NO coinciden:
"password123" ✗
"$1$..." ✗ (MD5)
"$5$..." ✗ (SHA-256)
```

## 🎉 Resultado Final

Con esta corrección:

✅ Los usuarios de la app móvil pueden hacer login en el sistema web
✅ No hay doble hash
✅ Las contraseñas se sincronizan correctamente
✅ El sistema detecta automáticamente si hay que hashear o no
✅ Compatible con contraseñas hasheadas, en texto plano, o sin contraseña

¡El problema está resuelto! 🚀

