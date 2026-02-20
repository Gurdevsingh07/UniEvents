try {
    $token = Get-Content "d:\uniEvents\v3\token.txt" -Raw
    $token = $token.Trim()
    $headers = @{
        "Authorization" = "Bearer $token"
    }

    $eventId = Get-Content "d:\uniEvents\v3\event_id.txt" -Raw
    $eventId = $eventId.Trim()

    $body = Get-Content "d:\uniEvents\v3\event.json" -Raw
    
    $uri = "http://localhost:8080/api/events/$eventId"
    Write-Host "Updating Event ID: $eventId"

    $response = Invoke-WebRequest -Uri $uri -Method Put -ContentType "application/json" -Headers $headers -Body $body -UseBasicParsing
    
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
