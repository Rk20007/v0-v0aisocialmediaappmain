Start-Sleep -Seconds 5

# Test 1: Login
Write-Host "`n=== TEST 1: Login ===" -ForegroundColor Cyan
try {
    $loginBody = '{"mobile":"7740847114","password":"robin@123"}'
    $loginResp = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -UseBasicParsing `
        -SessionVariable session
    Write-Host "Status: $($loginResp.StatusCode)" -ForegroundColor Green
    Write-Host "Body: $($loginResp.Content)"
    $cookie = $loginResp.Headers["Set-Cookie"]
    Write-Host "Cookie set: $(if ($cookie) { 'YES' } else { 'NO' })"
} catch {
    Write-Host "Login FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Admin stats (with session cookie)
Write-Host "`n=== TEST 2: Admin Stats ===" -ForegroundColor Cyan
try {
    $statsResp = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/stats" `
        -Method GET `
        -UseBasicParsing `
        -WebSession $session
    Write-Host "Status: $($statsResp.StatusCode)" -ForegroundColor Green
    Write-Host "Body: $($statsResp.Content)"
} catch {
    Write-Host "Stats FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Admin users list
Write-Host "`n=== TEST 3: Admin Users ===" -ForegroundColor Cyan
try {
    $usersResp = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/users?page=1&limit=5" `
        -Method GET `
        -UseBasicParsing `
        -WebSession $session
    Write-Host "Status: $($usersResp.StatusCode)" -ForegroundColor Green
    Write-Host "Body: $($usersResp.Content.Substring(0, [Math]::Min(300, $usersResp.Content.Length)))..."
} catch {
    Write-Host "Users FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Admin recharges
Write-Host "`n=== TEST 4: Admin Recharges ===" -ForegroundColor Cyan
try {
    $rechargesResp = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/recharges?page=1&limit=5" `
        -Method GET `
        -UseBasicParsing `
        -WebSession $session
    Write-Host "Status: $($rechargesResp.StatusCode)" -ForegroundColor Green
    Write-Host "Body: $($rechargesResp.Content.Substring(0, [Math]::Min(300, $rechargesResp.Content.Length)))..."
} catch {
    Write-Host "Recharges FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Admin images
Write-Host "`n=== TEST 5: Admin Images ===" -ForegroundColor Cyan
try {
    $imagesResp = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/images?page=1&limit=5" `
        -Method GET `
        -UseBasicParsing `
        -WebSession $session
    Write-Host "Status: $($imagesResp.StatusCode)" -ForegroundColor Green
    Write-Host "Body: $($imagesResp.Content.Substring(0, [Math]::Min(300, $imagesResp.Content.Length)))..."
} catch {
    Write-Host "Images FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Admin posts
Write-Host "`n=== TEST 6: Admin Posts ===" -ForegroundColor Cyan
try {
    $postsResp = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/posts?page=1&limit=5" `
        -Method GET `
        -UseBasicParsing `
        -WebSession $session
    Write-Host "Status: $($postsResp.StatusCode)" -ForegroundColor Green
    Write-Host "Body: $($postsResp.Content.Substring(0, [Math]::Min(300, $postsResp.Content.Length)))..."
} catch {
    Write-Host "Posts FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7: Unauthorized access (no session)
Write-Host "`n=== TEST 7: Unauthorized (no session) ===" -ForegroundColor Cyan
try {
    $unauthResp = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/stats" `
        -Method GET `
        -UseBasicParsing
    Write-Host "Status: $($unauthResp.StatusCode)"
    Write-Host "Body: $($unauthResp.Content)"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "Correctly rejected with status: $statusCode" -ForegroundColor Green
}

Write-Host "`n=== ALL TESTS COMPLETE ===" -ForegroundColor Cyan
