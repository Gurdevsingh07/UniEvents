try {
    # No auth token needed for verify (kiosk mode)
    # But let's check if endpoint requires it. FaceController doesn't have @PreAuthorize on verifyFace.

    $eventId = Get-Content "d:\uniEvents\v3\event_id.txt" -Raw
    $eventId = $eventId.Trim()

    # Read embedding from file
    $body = Get-Content "d:\uniEvents\v3\face_embedding.json" -Raw
    
    $uri = "http://localhost:8080/api/events/$eventId/check-in/face"
    Write-Host "Verifying Face for Event ID: $eventId"

    $response = Invoke-WebRequest -Uri $uri -Method Post -ContentType "application/json" -Body $body -UseBasicParsing
    
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
