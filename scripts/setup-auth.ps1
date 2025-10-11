# Setup Auth & SUPERADMIN - PowerShell Script
# Run from project root: .\scripts\setup-auth.ps1

Write-Host "🚀 Quinielas WL - Auth & SUPERADMIN Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path ".\package.json")) {
    Write-Host "❌ Error: Run this script from the project root" -ForegroundColor Red
    exit 1
}

# Step 1: Install dependencies
Write-Host "📦 Step 1/5: Installing dependencies..." -ForegroundColor Yellow
pnpm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 2: Generate Prisma Client
Write-Host "🔧 Step 2/5: Generating Prisma Client..." -ForegroundColor Yellow
Set-Location "packages\db"
pnpm prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma Client" -ForegroundColor Red
    Set-Location "..\..\"
    exit 1
}
Set-Location "..\..\"
Write-Host "✅ Prisma Client generated" -ForegroundColor Green
Write-Host ""

# Step 3: Create migration
Write-Host "🗄️  Step 3/5: Creating database migration..." -ForegroundColor Yellow
Write-Host "   This will create Auth.js tables (Account, Session, VerificationToken)" -ForegroundColor Gray
Set-Location "packages\db"
pnpm prisma migrate dev --name add-auth-tables
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create migration" -ForegroundColor Red
    Set-Location "..\..\"
    exit 1
}
Set-Location "..\..\"
Write-Host "✅ Migration created and applied" -ForegroundColor Green
Write-Host ""

# Step 4: Run seed
Write-Host "🌱 Step 4/5: Seeding database..." -ForegroundColor Yellow
Write-Host "   Creating SUPERADMIN user and demo data..." -ForegroundColor Gray
Set-Location "packages\db"
pnpm seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to seed database" -ForegroundColor Red
    Set-Location "..\..\"
    exit 1
}
Set-Location "..\..\"
Write-Host "✅ Database seeded" -ForegroundColor Green
Write-Host ""

# Step 5: Run tests
Write-Host "🧪 Step 5/5: Running tests..." -ForegroundColor Yellow
Set-Location "packages\api"
pnpm test src/lib/rbac.test.ts --run
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Some tests failed, but setup is complete" -ForegroundColor Yellow
} else {
    Write-Host "✅ All tests passed" -ForegroundColor Green
}
Set-Location "..\..\"
Write-Host ""

# Summary
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔐 SUPERADMIN User Created:" -ForegroundColor Cyan
Write-Host "   Email: vemancera@gmail.com" -ForegroundColor White
Write-Host "   Role: SUPERADMIN" -ForegroundColor White
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Start admin app: cd apps\admin && pnpm dev" -ForegroundColor White
Write-Host "   2. Navigate to: http://localhost:3001/auth/signin" -ForegroundColor White
Write-Host "   3. Sign in with: vemancera@gmail.com" -ForegroundColor White
Write-Host "   4. Check email for magic link" -ForegroundColor White
Write-Host "   5. Access tenant management: /superadmin/tenants" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   - Setup guide: SETUP_INSTRUCTIONS.md" -ForegroundColor White
Write-Host "   - Full docs: AUTH_SUPERADMIN_GUIDE.md" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Happy coding!" -ForegroundColor Green
