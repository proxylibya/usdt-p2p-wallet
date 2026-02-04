$headers = @{
    "Content-Type" = "application/json"
}

$body = @{
    phone = "+218912345678"
    password = "ChangeMe123!"
} | ConvertTo-Json

Write-Host "Testing login with:"
Write-Host "Phone: +218912345678"
Write-Host "Password: ChangeMe123!"
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3002/api/v1/auth/login" -Method POST -Headers $headers -Body $body
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "❌ Login failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}
