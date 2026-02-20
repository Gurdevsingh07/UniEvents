$headers = @{ "Content-Type" = "application/json" }
$body = @{
    fullName = "Verified User"
    email = "verified@example.com"
    password = "password123"
    studentId = "S112233"
    department = "CS"
    phone = "5555555555"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method Post -Headers $headers -Body $body
    Write-Host "Registration Success!"
    Write-Host "Response:" ($response | ConvertTo-Json -Depth 5)
} catch {
    Write-Host "Registration Failed!"
    Write-Host "Status:" $_.Exception.Response.StatusCode.value__
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Host "Body:" $reader.ReadToEnd()
}
