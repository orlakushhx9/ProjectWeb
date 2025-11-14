/**
 * EJEMPLO: Script para agregar contraseñas a usuarios existentes en Firebase
 * 
 * Este script es solo un ejemplo de cómo actualizar usuarios en Firebase
 * para agregar el campo 'password' necesario para el login en el sistema web.
 * 
 * IMPORTANTE: Este script debe ejecutarse desde la aplicación móvil o un script de admin
 * de Firebase, NO desde el servidor Node.js
 */

// ============================================================================
// OPCIÓN 1: Actualizar un solo usuario (desde app móvil o admin)
// ============================================================================

/*
import firebase from 'firebase/app';
import 'firebase/database';

// Actualizar un usuario específico con contraseña
async function agregarPasswordAUsuario(userId, password) {
  try {
    await firebase.database()
      .ref(`users/${userId}`)
      .update({
        password: password  // Agregar el campo password
      });
    
    console.log('Contraseña agregada exitosamente');
  } catch (error) {
    console.error('Error al agregar contraseña:', error);
  }
}

// Uso:
agregarPasswordAUsuario('uid_del_usuario', 'miPassword123');
*/


// ============================================================================
// OPCIÓN 2: Actualizar múltiples usuarios en batch (desde script de admin)
// ============================================================================

/*
import admin from 'firebase-admin';

// Inicializar Firebase Admin
const serviceAccount = require('./path-to-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project.firebaseio.com'
});

async function actualizarPasswordsEnBatch() {
  const db = admin.database();
  
  // Obtener todos los usuarios
  const usersSnapshot = await db.ref('users').once('value');
  const users = usersSnapshot.val();
  
  const updates = {};
  
  // Preparar actualizaciones
  for (const [userId, userData] of Object.entries(users)) {
    // Solo actualizar si el usuario no tiene contraseña
    if (!userData.password) {
      // Generar contraseña basada en el email (o usar una predeterminada)
      const emailPrefix = userData.email.split('@')[0];
      const defaultPassword = emailPrefix.substring(0, 6) + '123';
      
      updates[`users/${userId}/password`] = defaultPassword;
      
      console.log(`Usuario ${userData.email} - Contraseña: ${defaultPassword}`);
    }
  }
  
  // Aplicar todas las actualizaciones
  await db.ref().update(updates);
  console.log('Contraseñas actualizadas exitosamente');
}

// Ejecutar
actualizarPasswordsEnBatch().catch(console.error);
*/


// ============================================================================
// OPCIÓN 3: Estructura recomendada para nuevos usuarios
// ============================================================================

/*
const nuevoUsuario = {
  email: 'usuario@ejemplo.com',
  name: 'Nombre del Usuario',
  password: 'password123',  // ← Campo de contraseña
  displayName: 'Nombre del Usuario',
  role: 'estudiante',
  parentUid: null,  // Si tiene padre asignado
  createdAt: Date.now(),
  lastLoginAt: null
};

// Guardar en Firebase
firebase.database()
  .ref(`users/${userId}`)
  .set(nuevoUsuario);
*/


// ============================================================================
// OPCIÓN 4: Permitir que usuarios establezcan su contraseña (Recomendado)
// ============================================================================

/*
// En la app móvil, después del registro/login con Firebase Auth:

async function establecerPasswordParaWeb(userId, password) {
  try {
    // Validar contraseña
    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }
    
    // Guardar en Firebase Realtime Database
    await firebase.database()
      .ref(`users/${userId}`)
      .update({
        password: password,
        passwordUpdatedAt: Date.now()
      });
    
    alert('Contraseña para el sistema web establecida correctamente');
  } catch (error) {
    console.error('Error:', error);
    alert('Error al establecer contraseña');
  }
}

// UI en la app móvil:
// <Button onPress={() => {
//   const password = prompt('Establece tu contraseña para el sistema web');
//   establecerPasswordParaWeb(currentUser.uid, password);
// }}>
//   Configurar acceso web
// </Button>
*/


// ============================================================================
// ESTRUCTURA COMPLETA RECOMENDADA EN FIREBASE
// ============================================================================

/*
{
  "users": {
    "uid_usuario_1": {
      "email": "estudiante1@ejemplo.com",
      "name": "Estudiante Uno",
      "displayName": "Estudiante Uno",
      "password": "password123",       // ← Para login en sistema web
      "role": "estudiante",
      "parentUid": null,
      "professorUid": "uid_profesor_1",
      "createdAt": 1699999999999,
      "lastLoginAt": 1699999999999,
      "passwordUpdatedAt": 1699999999999
    },
    "uid_usuario_2": {
      "email": "padre1@ejemplo.com",
      "name": "Padre Uno",
      "displayName": "Padre Uno",
      "password": "password456",       // ← Para login en sistema web
      "role": "padre",
      "createdAt": 1699999999999,
      "lastLoginAt": 1699999999999,
      "passwordUpdatedAt": 1699999999999
    }
  },
  "gestureAttempts": {
    "uid_usuario_1": {
      "gesture1": {
        "timestamp": 1699999999999,
        "score": 85,
        "sign": "Hola",
        "status": "completed"
      }
    }
  }
}
*/


// ============================================================================
// NOTAS IMPORTANTES
// ============================================================================

/*
1. SEGURIDAD:
   - Idealmente, NO deberías guardar contraseñas en texto plano en Firebase
   - Firebase Authentication maneja contraseñas de forma segura
   - Esta solución es para casos donde necesitas sincronización con MySQL
   
2. ALTERNATIVAS MÁS SEGURAS:
   - Usar solo Firebase Authentication y sincronizar solo metadatos
   - Implementar SSO (Single Sign-On) entre Firebase y tu sistema web
   - Usar tokens de Firebase para autenticación en el backend
   
3. SI DEBES GUARDAR CONTRASEÑAS:
   - Considera hashearlas antes de guardarlas en Firebase también
   - Implementa rotación de contraseñas periódica
   - Usa HTTPS/SSL siempre
   - Implementa verificación de correo
   
4. BUENAS PRÁCTICAS:
   - Notifica a los usuarios cuando sincronices sus datos
   - Permite que cambien su contraseña fácilmente
   - Implementa recuperación de contraseña
   - Registra intentos de login fallidos
*/


// ============================================================================
// EJEMPLO COMPLETO: Formulario en la app móvil
// ============================================================================

/*
import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import firebase from 'firebase/app';

const ConfigurarAccesoWeb = ({ userId }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const handleSubmit = async () => {
    // Validaciones
    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }
    
    try {
      // Guardar en Firebase
      await firebase.database()
        .ref(`users/${userId}`)
        .update({
          password: password,
          passwordUpdatedAt: Date.now()
        });
      
      Alert.alert(
        'Éxito',
        'Contraseña establecida. Ya puedes acceder al sistema web con tu email y esta contraseña.'
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo establecer la contraseña');
      console.error(error);
    }
  };
  
  return (
    <View>
      <TextInput
        placeholder="Contraseña para sistema web"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        placeholder="Confirmar contraseña"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <Button title="Establecer Contraseña" onPress={handleSubmit} />
    </View>
  );
};

export default ConfigurarAccesoWeb;
*/

console.log('Este es un archivo de ejemplo. Lee los comentarios para implementar la solución.');

