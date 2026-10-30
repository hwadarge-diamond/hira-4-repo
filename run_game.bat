@echo off
title Launching RUN AND RUN (3D Cyberpunk Endless Runner)
echo ========================================================
echo        STARTING RUN AND RUN - 3D CYBERPUNK RUNNER
echo ========================================================
echo.
echo Starting local web server on port 8000...
start "" http://localhost:8000/index.html
python -m http.server 8000 --bind 127.0.0.1
pause
