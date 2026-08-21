# SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
# SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
$ErrorActionPreference = 'Stop'

$installer = Get-ChildItem -Path 'dist' -Filter 'Eidovara-0.22.3-Windows-x64-Setup.exe' | Select-Object -First 1
if (-not $installer) { throw 'The v0.22.3 Windows installer was not found in dist/.' }

$root = Join-Path $env:RUNNER_TEMP ('eidovara-v0223-smoke-' + [guid]::NewGuid().ToString('N'))
$installDir = Join-Path $root 'app'
New-Item -ItemType Directory -Force -Path $root | Out-Null

try {
  $install = Start-Process -FilePath $installer.FullName -ArgumentList @('/S', "/D=$installDir") -Wait -PassThru
  if ($install.ExitCode -ne 0) { throw "Silent installer exited with code $($install.ExitCode)." }

  $exe = Join-Path $installDir 'Eidovara.exe'
  $renderer = Join-Path $installDir 'resources\renderer\index.html'
  if (-not (Test-Path $exe)) { throw "Installed executable not found: $exe" }
  if (-not (Test-Path $renderer)) { throw "Packaged renderer entry not found: $renderer" }

  $app = Start-Process -FilePath $exe -PassThru
  Start-Sleep -Seconds 10
  $app.Refresh()
  if ($app.HasExited) { throw "Installed Eidovara exited during startup with code $($app.ExitCode)." }

  $log = Join-Path $env:APPDATA 'Eidovara\project-soul.log'
  if (Test-Path $log) {
    $recent = Get-Content $log -Tail 100 -ErrorAction SilentlyContinue
    if ($recent -match 'ERR_FILE_NOT_FOUND|Renderer entry is missing|Eidovara failed to load') {
      throw "Startup log contains a renderer-load failure. $log"
    }
  }

  Stop-Process -Id $app.Id -Force -ErrorAction SilentlyContinue
  $uninstaller = Get-ChildItem -Path $installDir -Filter 'Uninstall*.exe' -Recurse | Select-Object -First 1
  if (-not $uninstaller) { throw 'NSIS uninstaller was not created.' }
  $uninstall = Start-Process -FilePath $uninstaller.FullName -ArgumentList '/S' -Wait -PassThru
  if ($uninstall.ExitCode -ne 0) { throw "Silent uninstaller exited with code $($uninstall.ExitCode)." }
  Write-Host 'v0.22.3 install, renderer, launch, and uninstall smoke test OK.'
}
finally {
  Get-Process -Name Eidovara -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
  Remove-Item -Path $root -Recurse -Force -ErrorAction SilentlyContinue
}
