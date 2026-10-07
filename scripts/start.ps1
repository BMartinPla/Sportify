$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Instalá Node.js 22.13 o superior desde https://nodejs.org' }
if (-not (Test-Path -LiteralPath 'node_modules')) { npm install; if ($LASTEXITCODE -ne 0) { throw 'No se pudieron instalar las dependencias.' } }
npm run build
if ($LASTEXITCODE -ne 0) { throw 'No se pudo compilar la aplicación.' }
Start-Process 'http://localhost:3000'
npm start
