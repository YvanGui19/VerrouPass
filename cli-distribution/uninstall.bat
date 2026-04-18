@echo off
chcp 65001 >nul 2>&1

:: ============================================================================
:: VerrouPass CLI - Désinstallation
:: ============================================================================

title Désinstallation de VerrouPass CLI

echo.
echo ============================================================
echo   Désinstallation de VerrouPass CLI
echo ============================================================
echo.
echo Que souhaitez-vous désinstaller ?
echo.
echo   1^) Désinstallation standard ^(recommandé^)
echo      - Supprime les raccourcis
echo      - Désinstalle la version globale
echo      - Supprime les dépendances npm
echo      - Conserve les fichiers sources et votre configuration
echo.
echo   2^) Désinstallation complète
echo      - Tout ce qui précède +
echo      - Supprime TOUS les fichiers sources
echo      - Supprime votre configuration utilisateur
echo      - ATTENTION: Suppression définitive !
echo.
echo   3^) Annuler
echo.

choice /C 123 /N /M "Votre choix (1/2/3): "
set CHOICE=%errorlevel%

echo.
echo.

set FULL_UNINSTALL=0

if %CHOICE%==1 (
    echo Désinstallation standard...
) else if %CHOICE%==2 (
    echo ATTENTION: Désinstallation complète
    echo Tous les fichiers sources et votre configuration seront supprimés.
    echo.

    choice /C ON /M "Êtes-vous VRAIMENT sûr"

    if %errorlevel%==1 (
        set FULL_UNINSTALL=1
        echo.
        echo Désinstallation complète...
    ) else (
        echo.
        echo Désinstallation annulée.
        pause
        exit /b 0
    )
) else (
    echo Désinstallation annulée.
    pause
    exit /b 0
)

echo.

:: Supprimer le raccourci Bureau
if exist "%USERPROFILE%\Desktop\VerrouPass.lnk" (
    del "%USERPROFILE%\Desktop\VerrouPass.lnk"
    echo Raccourci Bureau supprimé
)

:: Supprimer le raccourci Menu Démarrer
if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\VerrouPass\" (
    rmdir /s /q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\VerrouPass"
    echo Raccourci Menu Démarrer supprimé
)

:: Désinstaller la version globale
where v-login >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo Désinstallation de la version globale...
    call npm uninstall -g verroupass-cli
    echo Version globale désinstallée
)

:: Supprimer node_modules
if exist "%~dp0node_modules\" (
    echo.
    echo Suppression des dépendances...
    rmdir /s /q "%~dp0node_modules"
    echo Dépendances supprimées
)

:: Si désinstallation complète, supprimer tout
if %FULL_UNINSTALL%==1 (
    echo.
    echo Suppression de la configuration utilisateur...

    :: Supprimer la configuration utilisateur
    if exist "%USERPROFILE%\.config\verroupass-cli\" (
        rmdir /s /q "%USERPROFILE%\.config\verroupass-cli"
        echo Configuration utilisateur supprimée
    )

    if exist "%APPDATA%\verroupass-cli\" (
        rmdir /s /q "%APPDATA%\verroupass-cli"
        echo Configuration utilisateur supprimée
    )

    echo.
    echo Suppression des fichiers sources...
    echo.
    echo Ce script va se supprimer lui-même dans 3 secondes...
    timeout /t 3 /nobreak >nul

    :: Créer un script temporaire pour supprimer le dossier
    set TEMP_SCRIPT=%TEMP%\verroupass_cleanup.bat
    set INSTALL_DIR=%~dp0

    echo @echo off > "%TEMP_SCRIPT%"
    echo timeout /t 2 /nobreak ^>nul >> "%TEMP_SCRIPT%"
    echo rmdir /s /q "%INSTALL_DIR%" >> "%TEMP_SCRIPT%"
    echo del "%%~f0" >> "%TEMP_SCRIPT%"

    start /min "" "%TEMP_SCRIPT%"

    echo.
    echo ============================================================
    echo   Désinstallation complète terminée
    echo ============================================================
    echo.
    echo VerrouPass CLI a été complètement supprimé.
    echo.

    exit /b 0
)

echo.
echo ============================================================
echo   Désinstallation terminée
echo ============================================================
echo.
echo VerrouPass CLI a été désinstallé.
echo.
echo Fichiers conservés:
echo   - Fichiers sources ^(dans ce dossier^)
echo   - Configuration utilisateur
echo.
echo Pour supprimer complètement, vous pouvez:
echo   - Relancer ce script et choisir l'option 2
echo   - Ou supprimer manuellement ce dossier
echo.

pause
