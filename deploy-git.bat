@echo off
echo ============================================
echo   SUBIR PROYECTO A GITHUB
echo ============================================
echo.

cd /d "%~dp0"

echo [1/6] Verificando estado de Git...
git status >nul 2>&1
if errorlevel 1 (
    echo Error: Git no esta instalado o no esta en el PATH
    echo.
    echo Descarga Git desde: https://git-scm.com
    pause
    exit /b
)

echo [2/6] Agregando archivos...
git add -A

echo.
echo [3/6] Creando commit inicial...
git commit -m "Sistema de Gestion de Facturas v1.0 - Firebase - PWA"

echo.
echo [4/6] Verificando branch main...
git branch -M main

echo.
echo [5/6] Agregando remote (si no existe)...
git remote -v | findstr "origin" >nul
if errorlevel 1 (
    git remote add origin https://github.com/JuanMatiasGuarnieri/sistemaDeGestionDeCobros.git
)

echo.
echo [6/6] Subiendo a GitHub...
git push -u origin main

echo.
echo ============================================
echo   COMPLETADO!
echo ============================================
pause