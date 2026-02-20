try {
    $token = Get-Content "d:\uniEvents\v3\token.txt" -Raw
    $token = $token.Trim()
    $headers = @{
        "Authorization" = "Bearer $token"
    }

    # Generate dummy embedding (128 random floats)
    $embedding = 1..128 | ForEach-Object { Get-Random -Minimum -1.0 -Maximum 1.0 }
    $embeddingJson = $embedding -join ","
    $body = "{`"embedding`": [$embeddingJson]}"
    
    # Save embedding for verification test
    $body | Out-File "d:\uniEvents\v3\face_embedding.json"

    Write-Host "Enrolling Face..."
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/face/enroll" -Method Post -ContentType "application/json" -Headers $headers -Body $body -UseBasicParsing
    
    Write-Host "Success!"
    Write-Host "StatusCode:" $response.StatusCode
    Write-Host "Response:" $response.Content

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
