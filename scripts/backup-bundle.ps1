$safe = 'C:\Dev\project---soul'
$dest = 'C:\Dev\backups'
New-Item -ItemType Directory -Force -Path $dest | Out-Null
$stamp = Get-Date -Format 'yyyy-MM-dd-HHmm'
Set-Location $safe
& git bundle create "$dest\eidovara-$stamp.bundle" --all
Get-ChildItem $dest -Filter *.bundle | Sort-Object LastWriteTime -Descending | Select-Object -Skip 8 | Remove-Item -Force
