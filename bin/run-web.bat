@echo off
echo.
echo [INFO] start web server.
echo.

%~d0
cd %~dp0

cd ..
rem yarn dev
npm run dev

pause