@echo off
cd /d "%~dp0"
echo.
echo Запускаю сервер. Зачекай кілька секунд...
echo Коли з'явиться рядок "Local: http://localhost:XXXX/" - відкрий цю адресу в браузері.
echo Щоб зупинити сервер - просто закрий це вікно.
echo.
call npm run dev
pause
