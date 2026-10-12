$ErrorActionPreference = 'Stop'
$env:PYTHONUTF8 = '1'
$serverDir = $PSScriptRoot
$docsDir = Split-Path -Parent $serverDir
$sandboxDir = Join-Path $docsDir 'sandbox'
$pythonExe = Join-Path $sandboxDir '.venv/Scripts/python.exe'
if (!(Test-Path -LiteralPath $pythonExe)) { throw '请先按照 README 在 docs/sandbox/.venv 安装环境。' }
$env:IC_DATA_DIR = Join-Path $sandboxDir 'data'
$env:IC_ALLOWED_HOSTS = '127.0.0.1,localhost,[::1]'
$env:IC_PUBLIC_ONLY = '0'
$env:IC_HTTPS = '0'
$env:IC_PORT = '8095'
Set-Location -LiteralPath $serverDir
& $pythonExe prepare_local.py
if ($LASTEXITCODE) { throw '密钥初始化失败' }
& $pythonExe manage.py migrate --noinput
if ($LASTEXITCODE) { throw '迁移失败' }
& $pythonExe manage.py bootstrap_preview
if ($LASTEXITCODE) { throw '初始化失败' }
& $pythonExe manage.py collectstatic --noinput
if ($LASTEXITCODE) { throw '静态资源收集失败' }
& $pythonExe serve.py
