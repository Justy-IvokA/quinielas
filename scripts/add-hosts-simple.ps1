# Simple script to add localhost subdomains to hosts file
# Run as Administrator

$hostsPath = "C:\Windows\System32\drivers\etc\hosts"

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Subdomain entries to add
$entries = @(
    "127.0.0.1       ivoka.localhost",
    "127.0.0.1       cocacola.localhost",
    "127.0.0.1       pepsi.localhost",
    "127.0.0.1       redbull.localhost",
    "127.0.0.1       cemex.localhost"
)

Write-Host "Adding subdomain entries to hosts file..." -ForegroundColor Cyan

# Read current hosts file
$hostsContent = Get-Content $hostsPath

# Check which entries need to be added
$entriesToAdd = @()
foreach ($entry in $entries) {
    $subdomain = $entry.Split()[1]
    $exists = $hostsContent | Where-Object { $_ -match $subdomain }
    
    if (-not $exists) {
        $entriesToAdd += $entry
        Write-Host "  Will add: $entry" -ForegroundColor Yellow
    } else {
        Write-Host "  Already exists: $subdomain" -ForegroundColor Green
    }
}

if ($entriesToAdd.Count -eq 0) {
    Write-Host "`nAll entries already exist!" -ForegroundColor Green
    exit 0
}

# Add new entries
Write-Host "`nAdding new entries..." -ForegroundColor Cyan
$newContent = $hostsContent + "" + "# Quinielas local subdomains" + $entriesToAdd
$newContent | Set-Content $hostsPath

Write-Host "Done! Added $($entriesToAdd.Count) entries" -ForegroundColor Green

# Flush DNS
Write-Host "`nFlushing DNS cache..." -ForegroundColor Cyan
ipconfig /flushdns | Out-Null

Write-Host "`nSuccess! You can now access:" -ForegroundColor Green
Write-Host "  - http://ivoka.localhost:3000" -ForegroundColor White
Write-Host "  - http://cocacola.localhost:3000" -ForegroundColor White
Write-Host "  - http://pepsi.localhost:3000" -ForegroundColor White
Write-Host "  - http://redbull.localhost:3000" -ForegroundColor White
Write-Host "  - http://cemex.localhost:3000" -ForegroundColor White
