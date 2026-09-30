param(
    [switch]$NoLaunch
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Step([string]$m) { Write-Host "`n==> $m" -ForegroundColor Cyan }
function Ok([string]$m)   { Write-Host "[OK] $m" -ForegroundColor Green }

function Refresh-Path {
    $machine = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $user = [Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = "$machine;$user;$env:USERPROFILE\.cargo\bin"
}

function Has([string]$name) {
    return $null -ne (Get-Command $name -ErrorAction SilentlyContinue)
}

function Run([string]$exe, [string[]]$args) {
    & $exe @args
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed ($LASTEXITCODE): $exe $($args -join ' ')"
    }
}

function WingetInstall([string]$id, [string[]]$extra = @()) {
    if (-not (Has "winget")) {
        throw "winget is missing. Install/update 'App Installer' from Microsoft Store and rerun."
    }

    Step "Installing $id"
    $args = @(
        "install", "--id", $id, "-e",
        "--accept-package-agreements",
        "--accept-source-agreements"
    ) + $extra

    Run "winget" $args
    Refresh-Path
}

function Ensure-Node {
    if (-not (Has "node") -or -not (Has "npm")) {
        WingetInstall "OpenJS.NodeJS.LTS" @("--silent")
    }
    Refresh-Path
    if (-not (Has "node") -or -not (Has "npm")) {
        throw "Node/npm was installed but is not visible yet. Open a new PowerShell window and rerun this script."
    }
    Ok "Node $(node --version), npm $(npm --version)"
}

function Ensure-Python {
    if (-not (Has "py") -and -not (Has "python")) {
        WingetInstall "Python.Python.3.12" @("--silent")
    }
    Refresh-Path
    if (-not (Has "py") -and -not (Has "python")) {
        throw "Python was installed but is not visible yet. Open a new PowerShell window and rerun this script."
    }
    if (Has "py") { Ok "$(py --version)" } else { Ok "$(python --version)" }
}

function Ensure-Rust {
    if (-not (Has "cargo")) {
        WingetInstall "Rustlang.Rustup" @("--silent")
    }
    Refresh-Path

    if (Has "rustup") {
        Run "rustup" @("toolchain", "install", "stable-msvc")
        Run "rustup" @("default", "stable-msvc")
    }

    Refresh-Path
    if (-not (Has "cargo")) {
        throw "Rust/cargo was installed but is not visible yet. Open a new PowerShell window and rerun this script."
    }
    Ok "$(cargo --version)"
}

function Have-VCTools {
    $vswhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
    if (-not (Test-Path $vswhere)) { return $false }

    $result = & $vswhere -latest -products * `
        -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 `
        -property installationPath 2>$null

    return -not [string]::IsNullOrWhiteSpace(($result | Out-String))
}

function Ensure-VCTools {
    if (Have-VCTools) {
        Ok "Visual Studio C++ Build Tools"
        return
    }

    WingetInstall "Microsoft.VisualStudio.2022.BuildTools" @(
        "--override",
        "--wait --passive --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
    )

    if (-not (Have-VCTools)) {
        throw "C++ Build Tools were not detected after installation. Reboot Windows if requested and rerun."
    }
    Ok "Visual Studio C++ Build Tools"
}

function Build-Sidecar([string]$name, [string]$dir) {
    $build = Join-Path $dir "build.ps1"
    if (-not (Test-Path $build)) {
        throw "Missing $build"
    }

    Step "Building $name"
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $build
    if ($LASTEXITCODE -ne 0) { throw "$name build failed." }
    Ok "$name"
}

$root = $PSScriptRoot
Set-Location $root

Write-Host "========================================" -ForegroundColor DarkCyan
Write-Host " KNeuron - first run bootstrap" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor DarkCyan

if (-not (Test-Path ".\package.json")) {
    throw "Put this file in the KNeuron repository root."
}

Step "Checking/installing system dependencies"
Refresh-Path
Ensure-Node
Ensure-Python
Ensure-Rust
Ensure-VCTools

Step "Installing JavaScript dependencies"
if (Test-Path ".\package-lock.json") {
    Run "npm" @("ci")
} else {
    Run "npm" @("install")
}
Ok "Node dependencies"

Build-Sidecar "BrainAccess bridge" (Join-Path $root "brainaccess-sidecar")
Build-Sidecar "SSVEP classifier" (Join-Path $root "ssvep-sidecar")
Build-Sidecar "BrainLink bridge" (Join-Path $root "brainlink-sidecar")

Step "Verifying sidecars"
$expected = @(
    "brainaccess-bridge-x86_64-pc-windows-msvc.exe",
    "ssvep-classifier-x86_64-pc-windows-msvc.exe",
    "brainlink-bridge-x86_64-pc-windows-msvc.exe"
)

foreach ($name in $expected) {
    $path = Join-Path $root "src-tauri\binaries\$name"
    if (-not (Test-Path $path)) {
        throw "Expected sidecar not found: $path"
    }
    Ok $name
}

if (-not (Test-Path ".\public\neuorrun\Build")) {
    Write-Warning "Neuorrun WebGL build is missing. Keep public/neuorrun/Build in the repo or build it separately."
} else {
    Ok "Neuorrun WebGL build"
}

Write-Host "`nKNeuron setup completed successfully." -ForegroundColor Green

if (-not $NoLaunch) {
    Step "Starting KNeuron"
    Run "npm" @("run", "tauri:dev")
} else {
    Write-Host "Run later with: npm run tauri:dev"
}
