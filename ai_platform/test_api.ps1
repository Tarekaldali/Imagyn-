$body = @{
    prompt = "makima"
    negative_prompt = "blury"
    model_name = "waiNSFWIllustrious_v150.safetensors"
    width = 768
    height = 768
    steps = 25
    cfg_scale = 7
    sampler = "dpmpp_2m"
    seed = -1
} | ConvertTo-Json

$headers = @{
    "accept" = "application/json"
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsImtpZCI6ImlRUEtNNUdFN0hsdEdsbmIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3ZrbG96Z2hwZHhncmlwc3piZXBqLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIyYmQ0Mjk5Zi02YTMwLTQwMjctYTRjOC1lOWJhZDA4YjMwNDEiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzU5ODA1NzYwLCJpYXQiOjE3NTk4MDIxNjAsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWxfdmVyaWZpZWQiOnRydWV9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzU5ODAyMTYwfV0sInNlc3Npb25faWQiOiJjOTcyNDM3Yi02MjU3LTRjMjctOTEwZC1iYzc5YjI3MTU1ZmUiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.1dVd6hIf1c1whWb66KufH4BVMCEaMNb-ABLAtg7y3wc"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8001/api/generate_image" -Method POST -Headers $headers -Body $body
    Write-Host "`n✅ SUCCESS!" -ForegroundColor Green
    Write-Host "`nResponse:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "`n❌ ERROR!" -ForegroundColor Red
    Write-Host "`nStatus Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    Write-Host "Error Message:" -ForegroundColor Yellow
    $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        Write-Host "`nDetails:" -ForegroundColor Yellow
        $_.ErrorDetails.Message
    }
}
