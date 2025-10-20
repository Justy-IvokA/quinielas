# Script to move superadmin pages to correct location

$source = "apps\admin\app\superadmin"
$dest = "apps\admin\app\[locale]\(authenticated)\superadmin"

Write-Host "Moving superadmin pages from $source to $dest"

# Create destination if it doesn't exist
if (!(Test-Path $dest)) {
    New-Item -ItemType Directory -Path $dest -Force | Out-Null
}

# Copy all files and folders
Copy-Item -Path "$source\*" -Destination $dest -Recurse -Force

Write-Host "✅ Superadmin pages moved successfully!"
Write-Host "You can now delete the old folder: $source"
