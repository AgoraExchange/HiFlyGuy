$ErrorActionPreference = 'Stop'
$pidFile = Join-Path $PSScriptRoot '.server.pid'
if (-not (Test-Path -LiteralPath $pidFile)) { Write-Output 'No launcher-managed HiFlyGuy server was found.'; exit }
$savedProcess = Get-Content -LiteralPath $pidFile -Raw | ConvertFrom-Json
$serverInfo = Get-Process -Id $savedProcess.id -ErrorAction SilentlyContinue
if ($serverInfo -and $serverInfo.ProcessName -eq 'node' -and $serverInfo.StartTime.ToUniversalTime().Ticks.ToString() -eq $savedProcess.startTicks) {
  Stop-Process -Id $savedProcess.id
  Write-Output 'HiFlyGuy server stopped.'
} elseif ($serverInfo) {
  throw 'The saved process no longer belongs to this HiFlyGuy server. It was not stopped.'
}
Remove-Item -LiteralPath $pidFile
