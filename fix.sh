# 修复 Docker 构建问题的 PowerShell 脚本

Write-Host "开始修复 Emergency Intervention System..." -ForegroundColor Green

# 1. 停止并清理现有容器
Write-Host "`n1. 清理现有容器..." -ForegroundColor Yellow
docker-compose down -v
docker system prune -f

# 2. 创建必要的目录和文件
Write-Host "`n2. 创建配置文件..." -ForegroundColor Yellow

# 创建 .env 文件（如果不存在）
if (!(Test-Path ".env")) {
    @"
# Frontend configuration
REACT_APP_API_BASE_URL=/api
REACT_APP_FHIR_BASE_URL=https://fhirserver.example.com
"@ | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "   创建了 .env 文件" -ForegroundColor Cyan
}

# 创建 backend/.env 文件（如果不存在）
if (!(Test-Path "backend/.env")) {
    @"
# Backend configuration
PORT=4000
MONGODB_URI=mongodb://mongodb:27017/emergency_db
JWT_SECRET=your_secure_jwt_secret_here_change_this_in_production
FHIR_BASE_URL=https://fhirserver.example.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
"@ | Out-File -FilePath "backend/.env" -Encoding UTF8
    Write-Host "   创建了 backend/.env 文件" -ForegroundColor Cyan
}

# 3. 删除 package-lock.json 以避免版本冲突
Write-Host "`n3. 清理包锁文件..." -ForegroundColor Yellow
if (Test-Path "package-lock.json") {
    Remove-Item "package-lock.json" -Force
    Write-Host "   删除了根目录的 package-lock.json" -ForegroundColor Cyan
}
if (Test-Path "backend/package-lock.json") {
    Remove-Item "backend/package-lock.json" -Force
    Write-Host "   删除了 backend/package-lock.json" -ForegroundColor Cyan
}

# 4. 构建并启动服务
Write-Host "`n4. 构建并启动 Docker 服务..." -ForegroundColor Yellow
docker-compose up --build -d

# 5. 等待服务启动
Write-Host "`n5. 等待服务启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 6. 检查服务状态
Write-Host "`n6. 检查服务状态..." -ForegroundColor Yellow
docker-compose ps

# 7. 测试连接
Write-Host "`n7. 测试服务连接..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000/api/health" -Method GET -ErrorAction Stop
    Write-Host "   ✓ 后端服务运行正常" -ForegroundColor Green
} catch {
    Write-Host "   ✗ 后端服务可能还在启动中，请稍后再试" -ForegroundColor Red
}

Write-Host "`n完成！" -ForegroundColor Green
Write-Host "前端访问地址: http://localhost:3000" -ForegroundColor Cyan
Write-Host "后端API地址: http://localhost:4000/api" -ForegroundColor Cyan
Write-Host "`n查看日志: docker-compose logs -f" -ForegroundColor Gray