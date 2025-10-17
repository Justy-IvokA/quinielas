# Setup Local Hosts for Subdomain Testing
# This script adds subdomain entries to the Windows hosts file
# Must be run as Administrator

param(
    [switch]$Remove,
    [switch]$Check
)

$hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"
$marker = "# Quinielas WL - Multi-tenant local testing"

$subdomains = @(
    "cocacola.localhost",
    "pepsi.localhost",
    "redbull.localhost",
    "ivoka.localhost",
    "admin.localhost"
)

function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Show-Hosts {
    Write-Host "`n📋 Current hosts file entries for Quinielas WL:" -ForegroundColor Cyan
    $content = Get-Content $hostsPath
    $inSection = $false
    
    foreach ($line in $content) {
        if ($line -eq $marker) {
            $inSection = $true
        }
        if ($inSection) {
            Write-Host $line -ForegroundColor Yellow
            if ($line -match "^\s*$") {
                break
            }
        }
    }
}

function Add-HostEntries {
    Write-Host "`n🔧 Adding subdomain entries to hosts file..." -ForegroundColor Green
    
    # Read current content
    $content = Get-Content $hostsPath
    
    # Check if marker already exists
    if ($content -contains $marker) {
        Write-Host "⚠️  Entries already exist. Use -Remove first to clean up." -ForegroundColor Yellow
        return
    }
    
    # Prepare new entries
    $newEntries = @()
    $newEntries += ""
    $newEntries += $marker
    foreach ($subdomain in $subdomains) {
        $newEntries += "127.0.0.1       $subdomain"
    }
    
    # Append to hosts file
    $content += $newEntries
    Set-Content -Path $hostsPath -Value $content -Force
    
    Write-Host "✅ Subdomain entries added successfully!" -ForegroundColor Green
    Write-Host "`nAdded entries:" -ForegroundColor Cyan
    foreach ($subdomain in $subdomains) {
        Write-Host "  - http://$subdomain:3000" -ForegroundColor White
    }
    
    # Flush DNS cache
    Write-Host "`n🔄 Flushing DNS cache..." -ForegroundColor Yellow
    ipconfig /flushdns | Out-Null
    Write-Host "✅ DNS cache flushed!" -ForegroundColor Green
}

function Remove-HostEntries {
    Write-Host "`n🗑️  Removing subdomain entries from hosts file..." -ForegroundColor Yellow
    
    # Read current content
    $content = Get-Content $hostsPath
    
    # Find and remove section
    $newContent = @()
    $inSection = $false
    
    foreach ($line in $content) {
        if ($line -eq $marker) {
            $inSection = $true
            continue
        }
        
        if ($inSection) {
            # Skip lines until we hit an empty line
            if ($line -match "^\s*$") {
                $inSection = $false
            }
            continue
        }
        
        $newContent += $line
    }
    
    Set-Content -Path $hostsPath -Value $newContent -Force
    
    Write-Host "✅ Subdomain entries removed successfully!" -ForegroundColor Green
    
    # Flush DNS cache
    Write-Host "`n🔄 Flushing DNS cache..." -ForegroundColor Yellow
    ipconfig /flushdns | Out-Null
    Write-Host "✅ DNS cache flushed!" -ForegroundColor Green
}

# Main execution
Write-Host @"
╔═══════════════════════════════════════════════════════╗
║   Quinielas WL - Local Subdomain Setup Script        ║
╚═══════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# Check if running as administrator
if (-not (Test-Administrator)) {
    Write-Host "❌ ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "`nTo run as Administrator:" -ForegroundColor Yellow
    Write-Host "1. Right-click on PowerShell" -ForegroundColor White
    Write-Host "2. Select 'Run as Administrator'" -ForegroundColor White
    Write-Host "3. Navigate to the scripts directory" -ForegroundColor White
    Write-Host "4. Run: .\setup-local-hosts.ps1" -ForegroundColor White
    exit 1
}

if ($Check) {
    Show-Hosts
    exit 0
}

if ($Remove) {
    Remove-HostEntries
} else {
    Add-HostEntries
}

Write-Host "`n📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: pnpm db:seed" -ForegroundColor White
Write-Host "2. Run: pnpm dev" -ForegroundColor White
Write-Host "3. Open browser and test:" -ForegroundColor White
Write-Host "   - http://cocacola.localhost:3000/es-MX" -ForegroundColor Green
Write-Host "   - http://pepsi.localhost:3000/es-MX" -ForegroundColor Green
Write-Host "   - http://redbull.localhost:3000/es-MX" -ForegroundColor Green
Write-Host "   - http://localhost:3000/es-MX (default)" -ForegroundColor Green
Write-Host ""
