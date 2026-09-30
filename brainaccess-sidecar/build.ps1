$ErrorActionPreference = "Stop"

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$VenvPath = Join-Path $PSScriptRoot ".venv"
$PythonPath = Join-Path $VenvPath "Scripts\python.exe"

if (-not (Test-Path $PythonPath)) {
    Write-Host "Creating Python virtual environment..."
    py -3.13 -m venv $VenvPath
}

Write-Host "Installing BrainAccess bridge dependencies..."
& $PythonPath -m pip install --upgrade pip
& $PythonPath -m pip install -r (Join-Path $PSScriptRoot "requirements.txt")

Write-Host "Building BrainAccess sidecar..."
Push-Location $PSScriptRoot
try {
    & $PythonPath -m PyInstaller --clean --noconfirm "brainaccess-bridge.spec"
}
finally {
    Pop-Location
}

$TargetTriple = ""
try {
    $TargetTriple = (& rustc --print host-tuple).Trim()
}
catch {
    $HostLine = (& rustc -Vv | Select-String "host:").Line
    $TargetTriple = ($HostLine -split "\s+")[1].Trim()
}

if ([string]::IsNullOrWhiteSpace($TargetTriple)) {
    throw "Could not determine the Rust target triple."
}

$SourceExe = Join-Path $PSScriptRoot "dist\brainaccess-bridge.exe"
if (-not (Test-Path $SourceExe)) {
    throw "PyInstaller did not create $SourceExe"
}

$BinariesDir = Join-Path $ProjectRoot "src-tauri\binaries"
New-Item -ItemType Directory -Force -Path $BinariesDir | Out-Null

$DestinationExe = Join-Path $BinariesDir "brainaccess-bridge-$TargetTriple.exe"
Copy-Item -Force $SourceExe $DestinationExe

Write-Host ""
Write-Host "BrainAccess sidecar built successfully:"
Write-Host $DestinationExe
Write-Host ""
Write-Host "Tauri externalBin entry remains: binaries/brainaccess-bridge"
