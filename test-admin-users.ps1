# Test Admin Users API
$adminToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YWExZTMxZi03OWIyLTQxOTUtYTRjNy04ZjZmYzg3NGFiZjAiLCJpYXQiOjE3NzAxODYxNjQsImV4cCI6MTc3MDE4NzA2NH0.ehEa9nk6uSk2tJ5aURY2PgnR-y-8KnhFkqhGVzX6sno"

Write-Host "Testing Admin Users API..." -ForegroundColor Cyan
Write-Host ""

# First, login as admin
Write-Host "1. Admin Login..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@usdt-p2p.local"
    password = "000000"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3002/api/v1/admin/login" -Method POST -ContentType "application/json" -Body $loginBody
    $adminToken = $loginResponse.token
    Write-Host "✅ Admin login successful!" -ForegroundColor Green
    Write-Host "Token: $($adminToken.Substring(0, 50))..." -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Admin login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Now fetch users
Write-Host "2. Fetching Users..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $adminToken"
    "Content-Type" = "application/json"
}

try {
    $usersResponse = Invoke-RestMethod -Uri "http://localhost:3002/api/v1/admin/users?page=1&limit=20" -Method GET -Headers $headers
    Write-Host "✅ Users fetched successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $usersResponse | ConvertTo-Json -Depth 5
} catch {
    Write-Host "❌ Failed to fetch users!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}
