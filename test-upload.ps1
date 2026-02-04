# Test Image Upload
Write-Host "=== Testing Image Upload ===" -ForegroundColor Cyan

# 1. Login first
$loginBody = @{
    phone = "+218912345678"
    password = "ChangeMe123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3002/api/v1/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
    $token = $loginResponse.accessToken
    Write-Host "Login Success!" -ForegroundColor Green
    
    # 2. Create a test image (1x1 pixel PNG)
    $base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    $imageBytes = [Convert]::FromBase64String($base64Image)
    $tempFile = [System.IO.Path]::GetTempFileName() + ".png"
    [System.IO.File]::WriteAllBytes($tempFile, $imageBytes)
    
    Write-Host "Test image created: $tempFile" -ForegroundColor Yellow
    
    # 3. Upload using multipart/form-data
    $filePath = $tempFile
    $url = "http://localhost:3002/api/v1/upload"
    
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    # Create multipart form data manually
    $boundary = [System.Guid]::NewGuid().ToString()
    $fileContent = [System.IO.File]::ReadAllBytes($filePath)
    $fileName = [System.IO.Path]::GetFileName($filePath)
    
    $bodyLines = @(
        "--$boundary",
        "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"",
        "Content-Type: image/png",
        "",
        [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString($fileContent),
        "--$boundary--"
    )
    
    $body = $bodyLines -join "`r`n"
    
    Write-Host "`nUploading image..." -ForegroundColor Cyan
    
    $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -ContentType "multipart/form-data; boundary=$boundary" -Body ([System.Text.Encoding]::GetEncoding("iso-8859-1").GetBytes($body))
    
    Write-Host "Upload SUCCESS!" -ForegroundColor Green
    Write-Host "URL: $($response.data.url)" -ForegroundColor Green
    
    # Cleanup
    Remove-Item $tempFile -Force
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Yellow
    }
}
