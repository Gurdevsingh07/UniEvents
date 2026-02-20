$headers = @{ "Content-Type" = "application/json" }
$body = @{
    email = "verified@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Headers $headers -Body $body
    Write-Host "Login Success!"
    Write-Host "Response:" ($response | ConvertTo-Json -Depth 5)
} catch {
    Write-Host "Login Failed!"
    Write-Host "Status:" $_.Exception.Response.StatusCode.value__
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Host "Body:" $reader.ReadToEnd()
}
