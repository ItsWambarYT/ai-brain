# ai-brain — one-liner setup for Windows PowerShell
# Usage: irm https://raw.githubusercontent.com/ItsWambarYT/ai-brain/main/setup.ps1 | iex

$ErrorActionPreference = "Stop"

# Check Node.js
try {
    $nodeVersion = (node --version 2>&1).ToString().TrimStart('v').Split('.')[0]
    if ([int]$nodeVersion -lt 18) {
        Write-Host "Error: Node.js v18+ required (found v$nodeVersion)" -ForegroundColor Red
        Write-Host "Update at https://nodejs.org" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "Error: Node.js is not installed." -ForegroundColor Red
    Write-Host "Install it from https://nodejs.org (v18 or higher required)" -ForegroundColor Yellow
    exit 1
}

Write-Host "Running ai-brain..." -ForegroundColor Cyan
npx ai-brain --yes
