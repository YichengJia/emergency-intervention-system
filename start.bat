#!/bin/bash
# start.sh - Quick start script for Emergency Intervention System

echo "=========================================="
echo "Emergency Intervention System - Quick Start"
echo "=========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if MongoDB is running
if ! command -v mongod &> /dev/null; then
    echo "Warning: MongoDB is not installed. Please install MongoDB or use Docker."
    echo "Do you want to continue with Docker setup? (y/n)"
    read -r response
    if [[ "$response" == "y" ]]; then
        USE_DOCKER=true
    else
        exit 1
    fi
fi

# Function to setup frontend
setup_frontend() {
    echo "Setting up frontend..."

    # Check if .env exists, if not create from example
    if [ ! -f .env ]; then
        echo "Creating .env file from example..."
        cat > .env << EOF
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_FHIR_SERVER=https://fhir.example.com
REACT_APP_SMART_CLIENT_ID=your-smart-client-id
REACT_APP_WEBSOCKET_URL=ws://localhost:5000
REACT_APP_ENVIRONMENT=development
EOF
    fi

    # Install dependencies
    echo "Installing frontend dependencies..."
    npm install

    echo "Frontend setup complete!"
}

# Function to setup backend
setup_backend() {
    echo "Setting up backend..."

    # Create backend directory if it doesn't exist
    if [ ! -d "backend" ]; then
        echo "Backend directory not found. Please ensure backend code is in ./backend directory"
        exit 1
    fi

    cd backend

    # Check if .env exists, if not create from example
    if [ ! -f .env ]; then
        echo "Creating backend .env file..."
        cat > .env << EOF
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/emergency-intervention
JWT_SECRET=your-very-secure-jwt-secret-key-$(openssl rand -hex 32)
CORS_ORIGIN=http://localhost:3000

# FHIR Server Configuration
FHIR_SERVER_URL=https://fhir.example.com
SMART_CLIENT_ID=your-smart-client-id
SMART_CLIENT_SECRET=your-smart-client-secret
SMART_REDIRECT_URI=http://localhost:3000/callback

# Security
BCRYPT_ROUNDS=10
SESSION_SECRET=your-session-secret-$(openssl rand -hex 32)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Database Encryption
DB_ENCRYPTION_KEY=$(openssl rand -hex 16)
EOF
        echo "Backend .env file created with secure random keys"
    fi

    # Install dependencies
    echo "Installing backend dependencies..."
    npm install

    # Ask if user wants to seed the database
    echo "Do you want to seed the database with sample data? (y/n)"
    read -r response
    if [[ "$response" == "y" ]]; then
        echo "Seeding database..."
        npm run seed
    fi

    cd ..
    echo "Backend setup complete!"
}

# Function to start services
start_services() {
    echo "Starting services..."

    if [ "$USE_DOCKER" = true ]; then
        echo "Starting with Docker..."
        docker-compose up -d
    else
        # Start MongoDB if not running
        if ! pgrep -x "mongod" > /dev/null; then
            echo "Starting MongoDB..."
            mongod --dbpath /usr/local/var/mongodb --logpath /usr/local/var/log/mongodb/mongo.log --fork
        fi

        # Start backend
        echo "Starting backend server..."
        cd backend && npm run dev &
        BACKEND_PID=$!
        cd ..

        # Wait for backend to start
        sleep 3

        # Start frontend
        echo "Starting frontend..."
        npm start &
        FRONTEND_PID=$!

        echo "=========================================="
        echo "Services started successfully!"
        echo "Frontend: http://localhost:3000"
        echo "Backend API: http://localhost:5000"
        echo "=========================================="
        echo "Press Ctrl+C to stop all services"

        # Wait for user to stop
        wait $FRONTEND_PID $BACKEND_PID
    fi
}

# Main execution
echo "1. Setup Frontend"
echo "2. Setup Backend"
echo "3. Setup Both"
echo "4. Start Services (if already setup)"
echo "5. Exit"
echo -n "Choose an option (1-5): "
read -r choice

case $choice in
    1)
        setup_frontend
        ;;
    2)
        setup_backend
        ;;
    3)
        setup_frontend
        setup_backend
        echo "Do you want to start the services now? (y/n)"
        read -r response
        if [[ "$response" == "y" ]]; then
            start_services
        fi
        ;;
    4)
        start_services
        ;;
    5)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid option"
        exit 1
        ;;
esac

---

# start.bat - Windows batch script for quick start
@echo off
echo ==========================================
echo Emergency Intervention System - Quick Start
echo ==========================================

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

echo Choose an option:
echo 1. Setup Frontend
echo 2. Setup Backend
echo 3. Setup Both
echo 4. Start Services (if already setup)
echo 5. Exit
set /p choice="Enter your choice (1-5): "

if %choice%==1 goto setup_frontend
if %choice%==2 goto setup_backend
if %choice%==3 goto setup_both
if %choice%==4 goto start_services
if %choice%==5 goto end

:setup_frontend
echo Setting up frontend...
if not exist .env (
    echo Creating .env file...
    (
        echo REACT_APP_API_URL=http://localhost:5000/api
        echo REACT_APP_FHIR_SERVER=https://fhir.example.com
        echo REACT_APP_SMART_CLIENT_ID=your-smart-client-id
        echo REACT_APP_WEBSOCKET_URL=ws://localhost:5000
        echo REACT_APP_ENVIRONMENT=development
    ) > .env
)
echo Installing frontend dependencies...
call npm install
echo Frontend setup complete!
goto end

:setup_backend
echo Setting up backend...
if not exist backend (
    echo Backend directory not found. Please ensure backend code is in ./backend directory
    pause
    exit /b 1
)
cd backend
if not exist .env (
    echo Creating backend .env file...
    (
        echo NODE_ENV=development
        echo PORT=5000
        echo MONGODB_URI=mongodb://localhost:27017/emergency-intervention
        echo JWT_SECRET=your-very-secure-jwt-secret-key-change-this
        echo CORS_ORIGIN=http://localhost:3000
        echo.
        echo # FHIR Server Configuration
        echo FHIR_SERVER_URL=https://fhir.example.com
        echo SMART_CLIENT_ID=your-smart-client-id
        echo SMART_CLIENT_SECRET=your-smart-client-secret
        echo SMART_REDIRECT_URI=http://localhost:3000/callback
        echo.
        echo # Security
        echo BCRYPT_ROUNDS=10
        echo SESSION_SECRET=your-session-secret-key
        echo RATE_LIMIT_WINDOW_MS=900000
        echo RATE_LIMIT_MAX_REQUESTS=100
        echo.
        echo # Database Encryption
        echo DB_ENCRYPTION_KEY=your-32-character-encryption-key
    ) > .env
)
echo Installing backend dependencies...
call npm install
cd ..
echo Backend setup complete!
goto end

:setup_both
call :setup_frontend
call :setup_backend
set /p start_now="Do you want to start the services now? (y/n): "
if /i %start_now%==y goto start_services
goto end

:start_services
echo Starting services...
echo Starting backend server...
start cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
echo Starting frontend...
start cmd /k "npm start"
echo ==========================================
echo Services started successfully!
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:5000
echo ==========================================
goto end

:end
pause