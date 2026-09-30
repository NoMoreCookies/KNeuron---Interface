$ErrorActionPreference = "Stop"

Write-Host "[BrainLink] Building brainlink-bridge..." -ForegroundColor Cyan

$PythonCommand = $null
$PythonPrefix = @()

$candidates = @(
    @{ Command = "py"; Prefix = @("-3.13") },
    @{ Command = "py"; Prefix = @("-3.12") },
    @{ Command = "py"; Prefix = @("-3.11") },
    @{ Command = "python"; Prefix = @() }
)

foreach ($candidate in $candidates) {
    try {
        & $candidate.Command @($candidate.Prefix) --version *> $null
        if ($LASTEXITCODE -eq 0) {
            $PythonCommand = $candidate.Command
            $PythonPrefix = @($candidate.Prefix)
            break
        }
    }
    catch {
        # Try the next launcher.
    }
}

if (-not $PythonCommand) {
    throw "Python 3.11+ was not found. Install Python and make sure 'py' or 'python' is available."
}

if (-not (Test-Path ".venv")) {
    & $PythonCommand @PythonPrefix -m venv .venv
    if ($LASTEXITCODE -ne 0) {
        throw "Could not create the BrainLink virtual environment."
    }
}

$VenvPython = Join-Path $PWD ".venv\Scripts\python.exe"
if (-not (Test-Path $VenvPython)) {
    throw "Virtual environment Python was not created."
}

& $VenvPython -m pip install --upgrade pip
& $VenvPython -m pip install -r requirements.txt

Write-Host "[BrainLink] Running ThinkGear parser tests..." -ForegroundColor Cyan
& $VenvPython .\test_parser.py
if ($LASTEXITCODE -ne 0) {
    throw "ThinkGear parser tests failed."
}

Write-Host "[BrainLink] Running PyInstaller..." -ForegroundColor Cyan
& $VenvPython -m PyInstaller --noconfirm --clean .\brainlink-bridge.spec
if ($LASTEXITCODE -ne 0) {
    throw "PyInstaller failed."
}

$HostLine = rustc -vV | Select-String "^host:"
if (-not $HostLine) {
    throw "Could not determine the Rust host target. Is rustc installed?"
}

$TargetTriple = ($HostLine.Line -split ":", 2)[1].Trim()
$DestinationDirectory = Join-Path $PSScriptRoot "..\src-tauri\binaries"
New-Item -ItemType Directory -Path $DestinationDirectory -Force | Out-Null

$BuiltExe = Join-Path $PSScriptRoot "dist\brainlink-bridge.exe"
if (-not (Test-Path $BuiltExe)) {
    throw "Expected PyInstaller output was not found: $BuiltExe"
}

$DestinationExe = Join-Path $DestinationDirectory "brainlink-bridge-$TargetTriple.exe"
Copy-Item $BuiltExe $DestinationExe -Force

Write-Host ""
Write-Host "[BrainLink] Done." -ForegroundColor Green
Write-Host "Binary: $DestinationExe"
Write-Host "Tauri externalBin entry: binaries/brainlink-bridge"
