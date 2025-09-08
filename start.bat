@echo off
REM Start both backend and frontend for development on Windows
cd backend
echo Starting backend...
npm install
start /B cmd /c "npm run dev"
cd ..
echo Starting frontend...
npm install
start /B cmd /c "npm start"
pause