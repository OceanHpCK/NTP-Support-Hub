# Build toàn bộ 8 frontend + gom tài liệu PDF vào ntp-support-hub/server/public
# để deploy lên Cloudflare Worker (static assets + API cùng một origin).
#
# Cách dùng:  powershell -ExecutionPolicy Bypass -File scripts\build-cloudflare.ps1
# Sau đó:     cd ntp-support-hub\server ; npx wrangler deploy

$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$publicDir = Join-Path $root 'ntp-support-hub\server\public'

$apps = @(
    'ntp-support-hub',
    'hdd-pro-calculator',
    'hdpe-sinking-calculator',
    'pipe-heat-loss-calculator',
    'pipecalc-pro',
    'polyweld-pro',
    'tien-phong-cement-calculator',
    'water-hammer-calculator'
)

foreach ($app in $apps) {
    $appDir = Join-Path $root $app
    Write-Host "==> Building $app ..." -ForegroundColor Cyan
    Push-Location $appDir
    try {
        if (Test-Path 'package-lock.json') { npm ci } else { npm install }
        if ($LASTEXITCODE -ne 0) { throw "npm install that bai cho $app" }
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "Build that bai cho $app" }
    } finally {
        Pop-Location
    }
}

Write-Host '==> Gom output vao server/public ...' -ForegroundColor Cyan
if (Test-Path $publicDir) { Remove-Item $publicDir -Recurse -Force }
New-Item -ItemType Directory -Force $publicDir | Out-Null

# Hub nằm ở root
Copy-Item (Join-Path $root 'ntp-support-hub\dist\*') $publicDir -Recurse -Force

# Các app con nằm dưới subpath đúng với base trong vite.config
foreach ($app in $apps | Where-Object { $_ -ne 'ntp-support-hub' }) {
    $dest = Join-Path $publicDir $app
    New-Item -ItemType Directory -Force $dest | Out-Null
    Copy-Item (Join-Path $root "$app\dist\*") $dest -Recurse -Force
}

# Tài liệu PDF kỹ thuật
$docsSrc = Join-Path $root 'ntp-support-hub\document_technical'
if (Test-Path $docsSrc) {
    Copy-Item $docsSrc (Join-Path $publicDir 'documents') -Recurse -Force
}

$fileCount = (Get-ChildItem $publicDir -Recurse -File | Measure-Object).Count
Write-Host "==> XONG! $fileCount file trong $publicDir" -ForegroundColor Green
Write-Host 'Deploy:  cd ntp-support-hub\server ; npx wrangler deploy' -ForegroundColor Yellow
