#!/usr/bin/env node

/**
 * Script para convertir serviceAccountKey.json a variable de entorno
 * Uso: node scripts/convert-firebase-key.js [ruta-al-archivo]
 */

const fs = require('fs');
const path = require('path');

const filePath = process.argv[2] || path.join(__dirname, '..', 'credenciales', 'serviceAccountKey.json');

try {
    if (!fs.existsSync(filePath)) {
        console.error(`❌ Error: No se encontró el archivo en: ${filePath}`);
        console.log('\n💡 Uso: node scripts/convert-firebase-key.js [ruta-al-archivo]');
        process.exit(1);
    }

    const jsonContent = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(jsonContent);
    const jsonString = JSON.stringify(parsed);

    console.log('\n✅ JSON válido encontrado!\n');
    console.log('📋 Copia el siguiente valor para la variable de entorno FIREBASE_SERVICE_ACCOUNT_JSON:\n');
    console.log('─'.repeat(80));
    console.log(jsonString);
    console.log('─'.repeat(80));
    console.log('\n💡 Para Vercel:');
    console.log('   1. Ve a tu proyecto en Vercel');
    console.log('   2. Settings > Environment Variables');
    console.log('   3. Agrega FIREBASE_SERVICE_ACCOUNT_JSON');
    console.log('   4. Pega el valor de arriba (sin saltos de línea)');
    console.log('\n💡 Para Docker:');
    console.log('   Agrega al archivo .env o docker-compose.yml:');
    console.log(`   FIREBASE_SERVICE_ACCOUNT_JSON='${jsonString}'`);
    console.log('\n');

} catch (error) {
    console.error('❌ Error al procesar el archivo:', error.message);
    if (error instanceof SyntaxError) {
        console.error('   El archivo no contiene un JSON válido');
    }
    process.exit(1);
}

