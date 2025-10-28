@echo off
echo 🚀 Iniciando Sistema de Detección de Lenguaje de Señas
echo.
echo 📍 Servidor Node.js: http://localhost:3000
echo 📍 Documentación API: http://localhost:3000/api-docs
echo.
echo ⚠️  IMPORTANTE: Asegúrate de que XAMPP esté ejecutándose
echo.
echo 🐍 Para detección REAL (opcional):
echo    1. Ejecuta: install_python_detector.bat
echo    2. Ejecuta: start_python_detector.bat
echo.
echo 🎯 Para detección SIMULADA (actual):
echo    Solo necesitas este servidor Node.js
echo.
echo ========================================
echo.

cd /d "%~dp0"
node server.js
