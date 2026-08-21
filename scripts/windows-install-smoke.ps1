# SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
# SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
$ErrorActionPreference = 'Stop'

$installer = Get-ChildItem -Path 'dist' -Filter 'Eidovara-*-Windows-x64-Setup.exe' | Select-Object -First 1
if (-not $installer) { throw 'Windows installer was not found in dist/.' }

$root = Join-Path $env:RUNNER_TEMP ('eidovara-install-smoke-' + [guid]::NewGuid().ToString('N'))
$installDir = Join-Path $root 'app'
New-Item -ItemType Directory -Force -Path $root | Out-Null

try {
  Write-Host "Installing $($installer.Name) into $installDir"
  $install = Start-Process -FilePath $installer.FullName -ArgumentList @('/S', "/D=$installDir") -Wait -PassThru
  if ($install.ExitCode -ne 0) { throw "Silent installer exited with code $($install.ExitCode)." }

  $exe = Join-Path $installDir 'Eidovara.exe'
  if (-not (Test-Path $exe)) { throw "Installed Eidovara.exe not found at $exe" }

  $info = (Get-Item $exe).VersionInfo
  if ($info.ProductName -and $info.ProductName -notmatch 'Eidovara') {
    throw "Unexpected ProductName: $($info.ProductName)"
  }

  Write-Host 'Launching installed application for startup/crash smoke test.'
  $app = Start-Process -FilePath $exe -PassThru
  Start-Sleep -Seconds 10
  $app.Refresh()
  if ($app.HasExited) { throw "Installed application exited during startup smoke test with code $($app.ExitCode)." }
  Stop-Process -Id $app.Id -Force -ErrorAction SilentlyContinue

  $uninstaller = Get-ChildItem -Path $installDir -Filter 'Uninstall*.exe' -Recurse | Select-Object -First 1
  if (-not $uninstaller) { throw 'NSIS uninstaller was not created.' }

  Write-Host 'Running silent uninstall smoke test.'
  $uninstall = Start-Process -FilePath $uninstaller.FullName -ArgumentList '/S' -Wait -PassThru
  if ($uninstall.ExitCode -ne 0) { throw "Silent uninstaller exited with code $($uninstall.ExitCode)." }
  Start-Sleep -Seconds 2
  if (Test-Path $exe) { throw 'Installed executable still exists after silent uninstall.' }

  Write-Host 'Windows install/start/uninstall smoke test OK.'
}
finally {
  Get-Process -Name Eidovara -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
  Remove-Item -Path $root -Recurse -Force -ErrorAction SilentlyContinue
}
