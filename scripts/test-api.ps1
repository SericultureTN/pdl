$ErrorActionPreference = "Stop"
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$loginBody = @{ email = "admin@example.com"; password = "Admin123!" } | ConvertTo-Json

Write-Host "=== POST /api/login ==="
$login = Invoke-RestMethod -Uri "http://localhost:4000/api/login" -Method POST -Body $loginBody -ContentType "application/json" -WebSession $session
$login | ConvertTo-Json -Depth 5

Write-Host "`n=== GET /api/me ==="
$me = Invoke-RestMethod -Uri "http://localhost:4000/api/me" -WebSession $session
$me | ConvertTo-Json -Depth 5

Write-Host "`n=== GET /api/admin/dashboard ==="
$dash = Invoke-RestMethod -Uri "http://localhost:4000/api/admin/dashboard" -WebSession $session
Write-Host "ok:" $dash.ok

Write-Host "`n=== GET /api/regions ==="
$regions = Invoke-RestMethod -Uri "http://localhost:4000/api/regions" -WebSession $session
Write-Host "regions count:" $regions.regions.Count

Write-Host "`n=== GET /api/sericulturists/statistics ==="
$stats = Invoke-RestMethod -Uri "http://localhost:4000/api/sericulturists/statistics" -WebSession $session
Write-Host "stats ok:" $stats.ok

Write-Host "`n=== GET /api/financial-years ==="
$years = Invoke-RestMethod -Uri "http://localhost:4000/api/financial-years" -WebSession $session
Write-Host "years:" ($years.years | Measure-Object).Count

Write-Host "`n=== ALL TESTS PASSED ==="
