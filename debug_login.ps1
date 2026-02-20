try {
    $body = Get-Content "d:\uniEvents\v3\login.json" -Raw
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/auth/login" -Method Post -ContentType "application/json" -Body $body
    Write-Host "Success!"
} catch {
    Write-Host "Error Caught!"
    if ($_.Exception.Response) {
        Write-Host "StatusCode:" $_.Exception.Response.StatusCode.value__
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $content = $reader.ReadToEnd()
        Write-Host "Response Body:" $content
    } else {
        Write-Host "Exception:" $_.Exception.Message
    }
}
