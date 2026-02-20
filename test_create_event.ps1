try {
    $token = Get-Content "d:\uniEvents\v3\token.txt" -Raw
    $token = $token.Trim()
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    $body = Get-Content "d:\uniEvents\v3\event.json" -Raw
    
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/events" -Method Post -ContentType "application/json" -Headers $headers -Body $body -UseBasicParsing
    
    Write-Host "Success!"
    Write-Host "StatusCode:" $response.StatusCode
    Write-Host "Response:" $response.Content
    
    # Save Event ID for next steps
    $json = $response.Content | ConvertFrom-Json
    if ($json.data.id) {
        $json.data.id | Out-File "d:\uniEvents\v3\event_id.txt"
        Write-Host "Event ID Saved: " $json.data.id
    }

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
