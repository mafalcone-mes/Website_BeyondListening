# Beyond Listening - makes sure a recent Node.js is available (Windows).
# Called by "Start/Stop Beyond Listening.bat".
# If Node.js 20.9+ is not installed, a private copy is downloaded into .runtime\
# (no administrator rights needed, nothing is installed system-wide).
# Writes the folder to add to PATH into .runtime\node-path.txt (empty = use system Node).

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$NodeLine = 'latest-v24.x'

$root = Split-Path -Parent $PSScriptRoot
$runtime = Join-Path $root '.runtime'
New-Item -ItemType Directory -Force -Path $runtime | Out-Null
$pathFile = Join-Path $runtime 'node-path.txt'
$portable = Join-Path $runtime 'node'

function Test-NodeOk([string]$exe) {
  try {
    $v = & $exe -v 2>$null
    if ($v -match '^v(\d+)\.(\d+)') {
      $major = [int]$Matches[1]; $minor = [int]$Matches[2]
      return ($major -gt 20) -or ($major -eq 20 -and $minor -ge 9)
    }
  } catch {}
  return $false
}

try {
  $system = Get-Command node -ErrorAction SilentlyContinue
  if ($system -and (Test-NodeOk $system.Source)) {
    Set-Content -Path $pathFile -Value '' -NoNewline -Encoding ascii
    exit 0
  }
  if (Test-NodeOk (Join-Path $portable 'node.exe')) {
    Set-Content -Path $pathFile -Value $portable -NoNewline -Encoding ascii
    exit 0
  }

  Write-Host 'Downloading Node.js (one time, about 35 MB)...'
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  $arch = if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { 'arm64' } else { 'x64' }
  $base = "https://nodejs.org/dist/$NodeLine"
  $sums = (Invoke-WebRequest "$base/SHASUMS256.txt" -UseBasicParsing).Content
  if ($sums -is [byte[]]) { $sums = [Text.Encoding]::UTF8.GetString($sums) }
  $line = ($sums -split "`n") | Where-Object { $_ -match "node-v[\d.]+-win-$arch\.zip\s*$" } | Select-Object -First 1
  if (-not $line) { throw 'Could not reach nodejs.org. Check your internet connection and try again.' }
  $hash, $file = $line.Trim() -split '\s+'

  $zip = Join-Path $runtime $file
  Invoke-WebRequest "$base/$file" -OutFile $zip -UseBasicParsing
  if ((Get-FileHash $zip -Algorithm SHA256).Hash.ToLower() -ne $hash.ToLower()) {
    Remove-Item $zip -Force
    throw 'The download could not be verified. Please try again.'
  }
  if (Test-Path $portable) { Remove-Item $portable -Recurse -Force }
  Expand-Archive -Path $zip -DestinationPath $runtime -Force
  Remove-Item $zip -Force
  Rename-Item -Path (Join-Path $runtime ($file -replace '\.zip$', '')) -NewName 'node'
  Set-Content -Path $pathFile -Value $portable -NoNewline -Encoding ascii
  Write-Host 'Node.js is ready.'
  exit 0
} catch {
  Write-Host ''
  Write-Host $_.Exception.Message -ForegroundColor Red
  exit 1
}
