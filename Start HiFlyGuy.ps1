param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
# Normalize duplicate Path/PATH keys inherited from some Windows terminals.
$launchSearchPath = $env:Path
[Environment]::SetEnvironmentVariable('PATH', $null, 'Process')
[Environment]::SetEnvironmentVariable('Path', $launchSearchPath, 'Process')
$projectPath = $PSScriptRoot
$siteAddress = 'http://127.0.0.1:5180'
$isOurSite = $false
try {
  $response = Invoke-WebRequest -Uri $siteAddress -UseBasicParsing -TimeoutSec 2
  $isOurSite = $response.Content -match 'HiFlyGuy'
  if (-not $isOurSite) { throw 'Port 5180 is already used by another website.' }
} catch {
  if ($_.Exception.Message -match 'another website') { throw }
}
if (-not $isOurSite) {
  $vitePath = Join-Path $projectPath 'node_modules\vite\bin\vite.js'
  if (-not (Test-Path -LiteralPath $vitePath)) { throw 'Dependencies are missing. Run npm install in this project folder first.' }
  $nodePath = (Get-Command node -ErrorAction Stop).Source
  $serverProcess = Start-Process -FilePath $nodePath -ArgumentList @(('"' + $vitePath + '"'), '--configLoader', 'native') -WorkingDirectory $projectPath -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $projectPath 'server.log') -RedirectStandardError (Join-Path $projectPath 'server-error.log')
  @{ id = $serverProcess.Id; startTicks = $serverProcess.StartTime.ToUniversalTime().Ticks.ToString() } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $projectPath '.server.pid')
  for ($attempt = 0; $attempt -lt 40; $attempt++) {
    Start-Sleep -Milliseconds 250
    try {
      $response = Invoke-WebRequest -Uri $siteAddress -UseBasicParsing -TimeoutSec 1
      if ($response.Content -match 'HiFlyGuy') { $isOurSite = $true; break }
    } catch { }
    if ($serverProcess.HasExited) { break }
  }
  if (-not $isOurSite) { throw 'The server could not start. See server-error.log in this project folder.' }
}
# This visible process is the browser the user is opening to use the website.
if (-not $NoBrowser) { Start-Process $siteAddress }
Write-Output "HiFlyGuy is ready at $siteAddress"
