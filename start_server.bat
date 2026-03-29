@echo off
echo Iniciando el Servidor Local para el Socio Estrategico...
echo.
echo Por favor, abre tu navegador web y visita:
echo http://localhost:8080/
echo.
echo [No cierres esta ventana negra mientras uses la app]
python -m http.server 8080
pause
