@echo off
title TSP Sign Tools Installer
color 0A

echo.
echo ==========================================
echo        TSP SIGN TOOLS INSTALLER
echo ==========================================
echo.
echo Installing TSP Sign Tools...
echo.

set "UPIA=C:\Program Files\Common Files\Adobe\Adobe Desktop Common\RemoteComponents\UPI\UnifiedPluginInstallerAgent\UnifiedPluginInstallerAgent.exe"
set "ZXP=%~dp0TSP-Sign-Tools.zxp"

if not exist "%UPIA%" (
    echo.
    echo ERROR: Adobe Plugin Installer not found.
    echo Please install or update Adobe Creative Cloud Desktop.
    echo.
    pause
    exit /b 1
)

if not exist "%ZXP%" (
    echo.
    echo ERROR: TSP-Sign-Tools.zxp not found.
    echo Make sure the ZXP file is in the same folder as this installer.
    echo.
    pause
    exit /b 1
)

echo Adobe Plugin Installer found.
echo TSP Sign Tools package found.
echo.
echo Installing...
echo.

"%UPIA%" /install "%ZXP%"

if errorlevel 1 (
    echo.
    echo ==========================================
    echo              INSTALL FAILED
    echo ==========================================
    echo.
    echo Try running this installer as Administrator.
    echo.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo          INSTALLATION COMPLETE
echo ==========================================
echo.
echo TSP Sign Tools has been installed.
echo.
echo Open Adobe Illustrator and go to:
echo Window ^> Extensions ^> TSP Sign Tools
echo.
pause