-- ============================================================================
-- Script de Verificación y Limpieza de Usuarios
-- Usa este script para verificar y limpiar usuarios con problemas de hash
-- ============================================================================

-- 1. VER TODOS LOS USUARIOS Y SU TIPO DE HASH
-- ----------------------------------------------------------------------------
SELECT 
    id,
    name,
    email,
    CASE 
        WHEN password LIKE '$2a$%' THEN '✓ bcrypt $2a'
        WHEN password LIKE '$2b$%' THEN '✓ bcrypt $2b'
        WHEN password LIKE '$2y$%' THEN '✓ bcrypt $2y'
        ELSE '⚠ OTRO/PROBLEMA'
    END as tipo_password,
    LEFT(password, 20) as password_preview,
    firebase_uid,
    role,
    created_at
FROM users
ORDER BY id;


-- 2. CONTAR USUARIOS POR ORIGEN
-- ----------------------------------------------------------------------------
SELECT 
    CASE 
        WHEN firebase_uid IS NOT NULL THEN 'Firebase'
        ELSE 'Registro Web'
    END as origen,
    COUNT(*) as cantidad
FROM users
GROUP BY origen;


-- 3. VER SOLO USUARIOS DE FIREBASE
-- ----------------------------------------------------------------------------
SELECT 
    id,
    name,
    email,
    LEFT(password, 30) as password_preview,
    firebase_uid,
    role
FROM users
WHERE firebase_uid IS NOT NULL
ORDER BY created_at DESC;


-- 4. VERIFICAR SI HAY DOBLE HASH (Usuarios problemáticos)
-- ----------------------------------------------------------------------------
-- Los hashes bcrypt tienen 60 caracteres
-- Si hay doble hash, tendrían más caracteres o formato incorrecto
SELECT 
    id,
    name,
    email,
    LENGTH(password) as longitud_password,
    LEFT(password, 30) as password_preview,
    CASE 
        WHEN LENGTH(password) = 60 AND password LIKE '$2%' THEN '✓ Correcto'
        WHEN LENGTH(password) > 60 THEN '❌ Posible doble hash'
        WHEN LENGTH(password) < 60 THEN '❌ Hash incompleto'
        ELSE '⚠ Verificar manualmente'
    END as estado
FROM users
WHERE firebase_uid IS NOT NULL;


-- 5. ELIMINAR USUARIOS DE FIREBASE CON PROBLEMAS (CUIDADO!)
-- ----------------------------------------------------------------------------
-- ⚠️ IMPORTANTE: Haz un BACKUP antes de ejecutar esto
-- ⚠️ Solo ejecuta esto si estás seguro de que hay usuarios con doble hash

-- Primero, VER qué usuarios se eliminarían:
SELECT 
    id,
    name,
    email,
    'SE ELIMINARÁ' as accion
FROM users
WHERE firebase_uid IS NOT NULL;

-- Si estás seguro, descomenta y ejecuta:
-- DELETE FROM users WHERE firebase_uid IS NOT NULL;

-- Después de eliminar, vuelve a sincronizar desde el panel de admin


-- 6. HACER BACKUP DE USUARIOS
-- ----------------------------------------------------------------------------
-- Crea una tabla de respaldo antes de eliminar
CREATE TABLE IF NOT EXISTS users_backup_20241111 AS
SELECT * FROM users WHERE firebase_uid IS NOT NULL;

-- Para restaurar desde el backup:
-- INSERT INTO users SELECT * FROM users_backup_20241111;


-- 7. VERIFICAR QUE NO HAY DUPLICADOS
-- ----------------------------------------------------------------------------
SELECT 
    email,
    COUNT(*) as cantidad_duplicados
FROM users
GROUP BY email
HAVING COUNT(*) > 1;


-- 8. VER ESTADÍSTICAS DE ROLES
-- ----------------------------------------------------------------------------
SELECT 
    role as Rol,
    COUNT(*) as Cantidad,
    SUM(CASE WHEN firebase_uid IS NOT NULL THEN 1 ELSE 0 END) as De_Firebase,
    SUM(CASE WHEN firebase_uid IS NULL THEN 1 ELSE 0 END) as Registro_Web
FROM users
GROUP BY role;


-- 9. VERIFICAR CONTRASEÑAS ESPECÍFICAS
-- ----------------------------------------------------------------------------
-- Reemplaza 'EMAIL_DEL_USUARIO' con el email que quieres verificar
SELECT 
    id,
    name,
    email,
    password,
    LENGTH(password) as longitud,
    LEFT(password, 10) as inicio_hash,
    firebase_uid,
    created_at
FROM users
WHERE email = 'luispe@gmail.com';  -- Cambia esto por el email que necesitas


-- 10. LIMPIAR Y RE-SINCRONIZAR (Procedimiento Completo)
-- ----------------------------------------------------------------------------
/*
PASOS PARA LIMPIAR Y RE-SINCRONIZAR:

1. Hacer backup:
   CREATE TABLE users_backup AS SELECT * FROM users WHERE firebase_uid IS NOT NULL;

2. Ver usuarios que se eliminarán:
   SELECT id, name, email FROM users WHERE firebase_uid IS NOT NULL;

3. Eliminar usuarios de Firebase:
   DELETE FROM users WHERE firebase_uid IS NOT NULL;

4. Verificar que se eliminaron:
   SELECT COUNT(*) FROM users WHERE firebase_uid IS NOT NULL;  -- Debe ser 0

5. Ir al panel de administración en el navegador:
   http://localhost:5000/admin
   
6. Los usuarios se sincronizarán automáticamente al cargar la página

7. Verificar que se crearon correctamente:
   SELECT id, name, email, LEFT(password, 20) FROM users WHERE firebase_uid IS NOT NULL;

8. Probar login con las credenciales originales de Firebase
*/


-- 11. CONSULTAS ÚTILES ADICIONALES
-- ----------------------------------------------------------------------------

-- Ver usuarios creados hoy:
SELECT * FROM users 
WHERE DATE(created_at) = CURDATE()
ORDER BY created_at DESC;

-- Ver últimos 10 usuarios creados:
SELECT id, name, email, role, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 10;

-- Contar usuarios por rol:
SELECT role, COUNT(*) as cantidad 
FROM users 
GROUP BY role;


-- 12. RESETEAR PASSWORD DE UN USUARIO ESPECÍFICO (Emergencia)
-- ----------------------------------------------------------------------------
-- Si necesitas resetear la contraseña de un usuario manualmente:
-- Hash de "password123" con bcrypt:
-- $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

-- UPDATE users 
-- SET password = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
-- WHERE email = 'usuario@ejemplo.com';

-- Después el usuario puede hacer login con: password123


-- ============================================================================
-- NOTAS FINALES
-- ============================================================================
/*
- Siempre haz backup antes de eliminar usuarios
- Los logs del servidor mostrarán si las passwords están hasheadas o no
- Ejecuta estas consultas en phpMyAdmin o tu cliente MySQL favorito
- Si tienes dudas, consulta: docs/SOLUCION_PROBLEMA_DOBLE_HASH.md
*/

