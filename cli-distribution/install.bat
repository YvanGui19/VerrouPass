@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

:: ============================================================================
:: VerrouPass CLI - Installation et création de raccourcis
:: ============================================================================

title Installation de VerrouPass CLI

echo.
echo ============================================================
echo   Installation de VerrouPass CLI
echo ============================================================
echo.

:: Obtenir le répertoire du script
cd /d "%~dp0"
set "INSTALL_DIR=%cd%"

:: ============================================================================
:: Vérifier Node.js/npm
:: ============================================================================

echo [1/4] Vérification de Node.js et npm...

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERREUR] Node.js n'est pas installé.
    echo.
    echo Veuillez installer Node.js depuis https://nodejs.org/
    echo Version recommandée: LTS ^(20.x ou supérieur^)
    echo.
    echo Après l'installation, relancez ce script.
    echo.
    pause
    exit /b 1
)

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] npm n'est pas installé.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i

echo    Node.js: %NODE_VERSION%
echo    npm: %NPM_VERSION%
echo    OK
echo.

:: ============================================================================
:: Installer les dépendances
:: ============================================================================

echo [2/4] Installation des dépendances npm...
echo    Cela peut prendre quelques minutes...
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
echo    OK
echo.

:: ============================================================================
:: Créer les raccourcis (optionnel)
:: ============================================================================

echo [3/4] Création des raccourcis ^(optionnel^)
echo.

:: Demander pour le raccourci Bureau
choice /C ON /M "Créer un raccourci sur le Bureau"

if %errorlevel% equ 1 (
    powershell -ExecutionPolicy Bypass -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\VerrouPass.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\verroupass.bat'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.Description = 'VerrouPass - Gestionnaire de mots de passe'; $Shortcut.Save()"

    if exist "%USERPROFILE%\Desktop\VerrouPass.lnk" (
        echo    Raccourci Bureau créé
    ) else (
        echo    Raccourci Bureau: ECHEC
    )
) else (
    echo    Raccourci Bureau ignoré
)

echo.

:: Demander pour le raccourci Menu Démarrer
choice /C ON /M "Créer un raccourci dans le Menu Démarrer"

if %errorlevel% equ 1 (
    if not exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\VerrouPass\" (
        mkdir "%APPDATA%\Microsoft\Windows\Start Menu\Programs\VerrouPass"
    )

    powershell -ExecutionPolicy Bypass -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%APPDATA%\Microsoft\Windows\Start Menu\Programs\VerrouPass\VerrouPass.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\verroupass.bat'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.Description = 'VerrouPass - Gestionnaire de mots de passe'; $Shortcut.Save()"

    if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\VerrouPass\VerrouPass.lnk" (
        echo    Raccourci Menu Démarrer créé
    ) else (
        echo    Raccourci Menu Démarrer: ECHEC
    )
) else (
    echo    Raccourci Menu Démarrer ignoré
)

echo.

:: ============================================================================
:: Proposer l'installation globale
:: ============================================================================

echo [4/4] Installation globale ^(optionnel^)
echo.
echo Voulez-vous installer VerrouPass globalement ?
echo Cela vous permettra d'utiliser les commandes v-login, v-list, etc.
echo depuis n'importe quel terminal.
echo.

choice /C ON /M "Installer globalement"

if %errorlevel% equ 1 (
    echo.
    echo Installation globale en cours...
    call npm install -g .

    if %errorlevel% equ 0 (
        echo.
        echo Installation globale réussie !
        echo Vous pouvez maintenant utiliser les commandes v-login, v-list, etc.
        echo depuis n'importe quel terminal.
    ) else (
        echo.
        echo L'installation globale a échoué.
        echo Vous pouvez l'essayer manuellement avec: npm install -g .
    )
) else (
    echo.
    echo Installation globale ignorée.
    echo Vous pouvez toujours utiliser le raccourci VerrouPass.
)

:: ============================================================================
:: Fin de l'installation
:: ============================================================================

echo.
echo ============================================================
echo   Installation terminée !
echo ============================================================
echo.

:: Vérifier quels raccourcis ont été créés
set "SHORTCUTS_CREATED=0"
if exist "%USERPROFILE%\Desktop\VerrouPass.lnk" (
    set "SHORTCUTS_CREATED=1"
    echo Raccourci créé: Bureau
)
if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\VerrouPass\VerrouPass.lnk" (
    set "SHORTCUTS_CREATED=1"
    echo Raccourci créé: Menu Démarrer
)

if %SHORTCUTS_CREATED% equ 0 (
    echo Aucun raccourci créé
)

echo.
echo Pour lancer VerrouPass:

if %SHORTCUTS_CREATED% equ 1 (
    echo   - Double-cliquez sur le raccourci VerrouPass
)

if exist "%INSTALL_DIR%\verroupass.bat" (
    echo   - Double-cliquez sur verroupass.bat dans ce dossier
)

where v-login >nul 2>&1
if %errorlevel% equ 0 (
    echo   - Utilisez les commandes v-login, v-list, v-get, etc. depuis un terminal
)

echo.

pause
