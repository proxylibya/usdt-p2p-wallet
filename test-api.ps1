# 1. Admin Login
$loginBody = @{
    email = "admin@usdt-p2p.local"
    password = "000000"
} | ConvertTo-Json

Write-Host "=== Testing Admin Login ===" -ForegroundColor Cyan
try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3002/api/v1/admin/login" -Method POST -ContentType "application/json" -Body $loginBody
    Write-Host "Login SUCCESS!" -ForegroundColor Green
    $token = $loginResponse.token
    Write-Host "Token: $($token.Substring(0,30))..."
    
    # 2. Get Users List
    Write-Host "`n=== Getting Users List ===" -ForegroundColor Cyan
    $headers = @{ Authorization = "Bearer $token" }
    $users = Invoke-RestMethod -Uri "http://localhost:3002/api/v1/admin/users" -Method GET -Headers $headers
    Write-Host "Total Users: $($users.total)" -ForegroundColor Green
    
    # 3. Create New User
    Write-Host "`n=== Creating New User ===" -ForegroundColor Cyan
    $newUser = @{
        phone = "+218911111111"
        name = "Test User Created"
        password = "TestPass123!"
    } | ConvertTo-Json
    
    try {
        $created = Invoke-RestMethod -Uri "http://localhost:3002/api/v1/admin/users" -Method POST -Headers $headers -ContentType "application/json" -Body $newUser
        Write-Host "User Created: $($created.user.name) - $($created.user.phone)" -ForegroundColor Green
    } catch {
        Write-Host "Create User Error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    # 4. Get Users Again
    Write-Host "`n=== Verifying User in List ===" -ForegroundColor Cyan
    $usersAfter = Invoke-RestMethod -Uri "http://localhost:3002/api/v1/admin/users" -Method GET -Headers $headers
    Write-Host "Total Users After: $($usersAfter.total)" -ForegroundColor Green
    
    # 5. Test Wallets Stats
    Write-Host "`n=== Testing Wallets ===" -ForegroundColor Cyan
    try {
        $wallets = Invoke-RestMethod -Uri "http://localhost:3002/api/v1/admin/wallets/stats" -Method GET -Headers $headers
        Write-Host "Wallets Stats: $($wallets.wallets.Count) assets" -ForegroundColor Green
    } catch {
        Write-Host "Wallets Error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    # 6. Test Transactions
    Write-Host "`n=== Testing Transactions ===" -ForegroundColor Cyan
    try {
        $transactions = Invoke-RestMethod -Uri "http://localhost:3002/api/v1/admin/transactions" -Method GET -Headers $headers
        Write-Host "Total Transactions: $($transactions.total)" -ForegroundColor Green
    } catch {
        Write-Host "Transactions Error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    # 7. Test Settings
    Write-Host "`n=== Testing Settings ===" -ForegroundColor Cyan
    try {
        $settings = Invoke-RestMethod -Uri "http://localhost:3002/api/v1/admin/settings" -Method GET -Headers $headers
        Write-Host "Settings loaded: $($settings.settings.Count) items" -ForegroundColor Green
    } catch {
        Write-Host "Settings Error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    # 8. Test Dashboard Stats
    Write-Host "`n=== Testing Dashboard ===" -ForegroundColor Cyan
    try {
        $dashboard = Invoke-RestMethod -Uri "http://localhost:3002/api/v1/admin/dashboard/stats" -Method GET -Headers $headers
        Write-Host "Dashboard loaded successfully" -ForegroundColor Green
    } catch {
        Write-Host "Dashboard Error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    Write-Host "`n=== ALL TESTS COMPLETED ===" -ForegroundColor Green
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    $_.Exception.Response
}
