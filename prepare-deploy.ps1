# Deploy Helper Script for Render.com
# Tự động hóa các bước chuẩn bị deploy

Write-Host "🚀 Render.com Deployment Helper" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Check if .env exists
$envPath = "Backend\my_store_backend\.env"
$envExamplePath = "Backend\my_store_backend\.env.example"

if (-not (Test-Path $envPath)) {
    Write-Host "⚠️  .env file not found!" -ForegroundColor Yellow
    Write-Host "📝 Creating .env from template...`n" -ForegroundColor Yellow
    
    if (Test-Path $envExamplePath) {
        Copy-Item $envExamplePath $envPath
        Write-Host "✅ Created .env file" -ForegroundColor Green
        Write-Host "⚠️  Please edit .env and fill in your database credentials!" -ForegroundColor Yellow
        Write-Host "   Location: $envPath`n" -ForegroundColor Gray
        
        # Open in notepad
        $response = Read-Host "Open .env in notepad now? (y/n)"
        if ($response -eq 'y') {
            notepad $envPath
        }
    } else {
        Write-Host "❌ .env.example not found!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ .env file exists`n" -ForegroundColor Green
}

# Test database connection
Write-Host "🔍 Testing database connection..." -ForegroundColor Cyan
$testScript = "Backend\my_store_backend\scripts\test_db_connection.js"

if (Test-Path $testScript) {
    $currentDir = Get-Location
    Set-Location "Backend\my_store_backend"
    
    try {
        node scripts/test_db_connection.js
        $dbTestSuccess = $LASTEXITCODE -eq 0
    } catch {
        Write-Host "❌ Error running test script: $_" -ForegroundColor Red
        $dbTestSuccess = $false
    }
    
    Set-Location $currentDir
    
    if (-not $dbTestSuccess) {
        Write-Host "`n⚠️  Database connection test failed!" -ForegroundColor Yellow
        Write-Host "   Please check your .env configuration before deploying." -ForegroundColor Yellow
        $continue = Read-Host "`nContinue anyway? (y/n)"
        if ($continue -ne 'y') {
            exit 1
        }
    }
} else {
    Write-Host "⚠️  Test script not found, skipping DB test`n" -ForegroundColor Yellow
}

# Check Git status
Write-Host "`n📋 Checking Git status..." -ForegroundColor Cyan
$gitStatus = git status --porcelain

if ($gitStatus) {
    Write-Host "⚠️  You have uncommitted changes:" -ForegroundColor Yellow
    git status --short
    
    $commit = Read-Host "`nCommit and push changes now? (y/n)"
    if ($commit -eq 'y') {
        $message = Read-Host "Enter commit message"
        if ([string]::IsNullOrWhiteSpace($message)) {
            $message = "Ready for Render deployment"
        }
        
        git add .
        git commit -m $message
        git push origin main
        
        Write-Host "✅ Changes pushed to GitHub`n" -ForegroundColor Green
    }
} else {
    Write-Host "✅ Working directory clean`n" -ForegroundColor Green
}

# Show deployment URLs
Write-Host "`n🌐 Render.com Deployment URLs:" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Dashboard:  https://dashboard.render.com" -ForegroundColor White
Write-Host "Docs:       https://render.com/docs" -ForegroundColor White
Write-Host ""

# Show checklist
Write-Host "📋 Pre-Deployment Checklist:" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "[✓] .env file configured" -ForegroundColor Green
Write-Host "[?] Database created and schema imported" -ForegroundColor Yellow
Write-Host "[?] Code pushed to GitHub" -ForegroundColor Yellow
Write-Host "[?] Render account connected to GitHub" -ForegroundColor Yellow
Write-Host ""

# Show environment variables needed
Write-Host "🔑 Environment Variables for Render:" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Backend Service:" -ForegroundColor White
Write-Host "  - NODE_ENV=production" -ForegroundColor Gray
Write-Host "  - PORT=10000" -ForegroundColor Gray
Write-Host "  - DATABASE_URL=<Neon pooled URL; hostname includes -pooler>" -ForegroundColor Gray
Write-Host "  - DB_POOL_MAX=10" -ForegroundColor Gray
Write-Host "  - DB_IDLE_TIMEOUT_MS=30000" -ForegroundColor Gray
Write-Host "  - DB_CONN_TIMEOUT_MS=15000" -ForegroundColor Gray
Write-Host "  - JWT_SECRET=<random-32-chars>" -ForegroundColor Gray
Write-Host "  - GEMINI_API_KEY=<your-gemini-key>" -ForegroundColor Gray
Write-Host ""
Write-Host "Frontend Service:" -ForegroundColor White
Write-Host "  - REACT_APP_API_URL=https://your-backend.onrender.com" -ForegroundColor Gray
Write-Host ""

# Generate random JWT secret
Write-Host "🎲 Random JWT_SECRET Generator:" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
$jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
Write-Host $jwtSecret -ForegroundColor Yellow
Write-Host ""

# Next steps
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "==============" -ForegroundColor Cyan
Write-Host "1. Go to https://dashboard.render.com" -ForegroundColor White
Write-Host "2. Click 'New +' → 'Blueprint'" -ForegroundColor White
Write-Host "3. Connect your GitHub repository" -ForegroundColor White
Write-Host "4. Render will read render.yaml automatically" -ForegroundColor White
Write-Host "5. Fill in the environment variables above" -ForegroundColor White
Write-Host "6. Click 'Apply' to deploy!" -ForegroundColor White
Write-Host ""

Write-Host "📚 For detailed guide, see:" -ForegroundColor Cyan
Write-Host "   - QUICK_START_RENDER.md (Quick start)" -ForegroundColor Gray
Write-Host "   - DEPLOY_RENDER_DOCKER.md (Full guide)" -ForegroundColor Gray
Write-Host ""

Write-Host "✨ Good luck with your deployment! 🚀" -ForegroundColor Green
