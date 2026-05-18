@echo off
echo ============================================
echo   CONFIGURAR GIT Y SUBIR A GITHUB
echo ============================================
echo.

cd /d "%~dp0"

echo [1/5] Configurando Git...
git config --global user.email "juanmatiasguarnieri@gmail.com"
git config --global user.name "Juan Matias Guarnieri"

echo [2/5] Inicializando repositorio...
git init

echo [3/5] Agregando archivos...
git add .

echo [4/5] Creando commit...
git commit -m "Sistema de Gestion de Facturas v1.0 - Firebase + PWA"

echo [5/5] Subiendo a GitHub...
git branch -M main

git remote -v | findstr "origin" >nul
if errorlevel 1 (
    git remote add origin https://github.com/JuanMatiasGuarnieri/sistemaDeGestionDeCobros.git
)

git push -u origin main

echo.
echo ============================================
echo   COMPLETADO!
echo ============================================
pause