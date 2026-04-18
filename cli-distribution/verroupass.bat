@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

:: ============================================================================
:: VerrouPass CLI - Lanceur Windows
:: ============================================================================

title VerrouPass - Gestionnaire de mots de passe

:: Obtenir le répertoire du script
cd /d "%~dp0"

:: ============================================================================
:: Vérifier Node.js/npm
:: ============================================================================

echo Vérification de l'environnement...
echo.

:: Vérifier si Node.js est installé
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js n'est pas installé.
    echo.
    echo Veuillez installer Node.js depuis https://nodejs.org/
    echo Version recommandée: LTS ^(20.x ou supérieur^)
    echo.
    echo Après l'installation, relancez ce programme.
    echo.
    pause
    exit /b 1
)

:: Vérifier la version de Node.js
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo Node.js: %NODE_VERSION%

:: Vérifier si npm est installé
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] npm n'est pas installé.
    echo.
    echo npm devrait être installé avec Node.js.
    echo Veuillez réinstaller Node.js depuis https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Vérifier la version de npm
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo npm: %NPM_VERSION%
echo.

:: ============================================================================
:: Vérifier et installer les dépendances
:: ============================================================================

if not exist "node_modules\" (
    echo Installation des dépendances...
    echo Cela peut prendre quelques minutes la première fois.
    echo.
    call npm install --no-audit --no-fund

    if %errorlevel% neq 0 (
        echo.
        echo [ERREUR] L'installation des dépendances a échoué.
        echo.
        pause
        exit /b 1
    )

    echo.
    echo Installation terminée !
    echo.
) else (
    :: Vérifier si package.json a été modifié
    if exist "package.json" (
        for %%F in ("package.json") do set PKG_TIME=%%~tF
        for %%F in ("node_modules\.") do set NM_TIME=%%~tF

        :: Note: Cette comparaison est basique, on pourrait améliorer
        :: Pour l'instant, on fait confiance que node_modules est à jour
    )
)

:: ============================================================================
:: Lancer VerrouPass CLI
:: ============================================================================

cls
echo.
echo ============================================================
echo   VerrouPass - Gestionnaire de mots de passe zero-knowledge
echo ============================================================
echo.

:: Lancer le CLI avec Node.js
node src/index.js %*

:: Si aucun argument n'est passé, afficher l'aide
if "%~1"=="" (
    echo.
    echo Pour utiliser VerrouPass, utilisez les commandes:
    echo   v-login      - Se connecter
    echo   v-list       - Lister vos mots de passe
    echo   v-get        - Récupérer un mot de passe
    echo   v-add        - Ajouter un mot de passe
    echo   v-generate   - Générer un mot de passe
    echo.
    echo Ou installez globalement avec: npm install -g .
    echo.
)

pause
