$headers = @{ "Content-Type" = "application/json" }
$body = @{
    email = "nonexistent@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Headers $headers -Body $body
    Write-Host "Login Unexpectedly Succeeded!"
} catch {
    Write-Host "Login Failed (Expected)!"
    Write-Host "Status:" $_.Exception.Response.StatusCode.value__
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Host "Body:" $reader.ReadToEnd()
}
