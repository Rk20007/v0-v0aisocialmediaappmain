Write-Host "=== TEST 1: Login ===" -ForegroundColor Cyan

$loginBody = '{"mobile":"7740847114","password":"robin@123"}'

try {
    $loginResp = Invoke-WebRequest `
        -Uri "http://localhost:3000/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -UseBasicParsing `
        -SessionVariable webSession

    Write-Host "LOGIN STATUS: $($loginResp.StatusCode)" -ForegroundColor Green
    Write-Host "LOGIN BODY: $($loginResp.Content)"
} catch {
    Write-Host "LOGIN FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response.StatusCode)"
    exit 1
}

Write-Host ""
Write-Host "=== TEST 2: Admin Stats ===" -ForegroundColor Cyan
try {
    $statsResp = Invoke-WebRequest `
        -Uri "http://localhost:3000/api/admin/stats" `
        -Method GET `
        -UseBasicParsing `
        -WebSession $webSession

    Write-Host "STATS STATUS: $($statsResp.StatusCode)" -ForegroundColor Green
    Write-Host "STATS BODY: $($statsResp.Content)"
} catch {
    Write-Host "STATS FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response code: $($_.Exception.Response.StatusCode.value__)"
}

Write-Host ""
Write-Host "=== TEST 3: Admin Users ===" -ForegroundColor Cyan
try {
    $usersResp = Invoke-WebRequest `
        -Uri "http://localhost:3000/api/admin/users?page=1&limit=3" `
        -Method GET `
        -UseBasicParsing `
        -WebSession $webSession

    Write-Host "USERS STATUS: $($usersResp.StatusCode)" -ForegroundColor Green
    $preview = $usersResp.Content.Substring(0, [Math]::Min(400, $usersResp.Content.Length))
    Write-Host "USERS BODY (preview): $preview"
} catch {
    Write-Host "USERS FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== TEST 4: Admin Recharges ===" -ForegroundColor Cyan
try {
    $rechargesResp = Invoke-WebRequest `
        -Uri "http://localhost:3000/api/admin/recharges?page=1&limit=3" `
        -Method GET `
        -UseBasicParsing `
        -WebSession $webSession

    Write-Host "RECHARGES STATUS: $($rechargesResp.StatusCode)" -ForegroundColor Green
    $preview = $rechargesResp.Content.Substring(0, [Math]::Min(400, $rechargesResp.Content.Length))
    Write-Host "RECHARGES BODY (preview): $preview"
} catch {
    Write-Host "RECHARGES FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== TEST 5: Admin Images ===" -ForegroundColor Cyan
try {
    $imagesResp = Invoke-WebRequest `
        -Uri "http://localhost:3000/api/admin/images?page=1&limit=3" `
        -Method GET `
        -UseBasicParsing `
        -WebSession $webSession

    Write-Host "IMAGES STATUS: $($imagesResp.StatusCode)" -ForegroundColor Green
    $preview = $imagesResp.Content.Substring(0, [Math]::Min(400, $imagesResp.Content.Length))
    Write-Host "IMAGES BODY (preview): $preview"
} catch {
    Write-Host "IMAGES FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== TEST 6: Admin Posts ===" -ForegroundColor Cyan
try {
    $postsResp = Invoke-WebRequest `
        -Uri "http://localhost:3000/api/admin/posts?page=1&limit=3" `
        -Method GET `
        -UseBasicParsing `
        -WebSession $webSession

    Write-Host "POSTS STATUS: $($postsResp.StatusCode)" -ForegroundColor Green
    $preview = $postsResp.Content.Substring(0, [Math]::Min(400, $postsResp.Content.Length))
    Write-Host "POSTS BODY (preview): $preview"
} catch {
    Write-Host "POSTS FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== TEST 7: Unauthorized access (no session) ===" -ForegroundColor Cyan
try {
    $unauthResp = Invoke-WebRequest `
        -Uri "http://localhost:3000/api/admin/stats" `
        -Method GET `
        -UseBasicParsing
    Write-Host "UNEXPECTED SUCCESS: $($unauthResp.StatusCode)" -ForegroundColor Yellow
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 401 -or $code -eq 403) {
        Write-Host "CORRECTLY REJECTED with $code" -ForegroundColor Green
    } else {
        Write-Host "Rejected with: $code $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== ALL TESTS DONE ===" -ForegroundColor Cyan
