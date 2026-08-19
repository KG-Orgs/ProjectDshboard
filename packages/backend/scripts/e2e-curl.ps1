$ErrorActionPreference = 'Stop'

$baseUrl = if ($env:BASE_URL) { $env:BASE_URL } else { 'http://127.0.0.1:3000' }
$email = "e2e-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())@example.com"
$password = 'password123'

function Invoke-CurlJson {
	param(
		[Parameter(Mandatory = $true)]
		[string]$Method,
		[Parameter(Mandatory = $true)]
		[string]$Url,
		[Parameter(Mandatory = $true)]
		[object]$Body,
		[string[]]$Headers = @()
	)

	$tempFile = [System.IO.Path]::GetTempFileName()

	try {
		$Body | ConvertTo-Json -Compress | Set-Content -Path $tempFile -Encoding utf8
		curl.exe -sS -X $Method $Url @Headers -H 'Content-Type: application/json' --data-binary "@$tempFile"
	}
	finally {
		Remove-Item $tempFile -ErrorAction SilentlyContinue
	}
}

Write-Host "Using API at $baseUrl"

Write-Host "1. Health"
curl.exe -s "$baseUrl/api/health"
Write-Host "`n"

Write-Host "2. Unauthorized projects request"
curl.exe -s -i "$baseUrl/api/projects"
Write-Host "`n"

Write-Host "3. Signup"
$signupRaw = Invoke-CurlJson -Method 'POST' -Url "$baseUrl/api/auth/signup" -Body @{ email = $email; password = $password; name = 'E2E User' }
$signup = $signupRaw | ConvertFrom-Json
$token = $signup.data.token
$authHeader = "Authorization: Bearer $token"
$authArgs = @('-H', $authHeader)
$contentArgs = @('-H', 'Content-Type: application/json')
$signupRaw
Write-Host "`n"

Write-Host "4. Login"
$loginRaw = Invoke-CurlJson -Method 'POST' -Url "$baseUrl/api/auth/login" -Body @{ email = $email; password = $password }
$login = $loginRaw | ConvertFrom-Json
$token = $login.data.token
$authHeader = "Authorization: Bearer $token"
$authArgs = @('-H', $authHeader)
$loginRaw
Write-Host "`n"

Write-Host "5. Refresh token"
curl.exe -s -X POST "$baseUrl/api/auth/refresh" @authArgs
Write-Host "`n"

Write-Host "6. List projects"
$projectsRaw = curl.exe -s "$baseUrl/api/projects" @authArgs
$projectsRaw
Write-Host "`n"

Write-Host "7. Create project"
$projectRaw = Invoke-CurlJson -Method 'POST' -Url "$baseUrl/api/projects" -Headers ($authArgs + $contentArgs) -Body @{ name = 'E2E Project'; description = 'Created via curl flow'; budget = 100000; endDate = '2026-12-31' }
$project = $projectRaw | ConvertFrom-Json
$projectId = $project.data.id
$projectRaw
Write-Host "`n"

Write-Host "8. List tasks"
curl.exe -s "$baseUrl/api/tasks" @authArgs
Write-Host "`n"

Write-Host "9. Create task"
$taskRaw = Invoke-CurlJson -Method 'POST' -Url "$baseUrl/api/tasks" -Headers ($authArgs + $contentArgs) -Body @{ projectId = $projectId; title = 'E2E Task'; description = 'Created via curl flow'; priority = 'high'; dueDate = '2026-06-01' }
$task = $taskRaw | ConvertFrom-Json
$taskId = $task.data.id
$taskRaw
Write-Host "`n"

Write-Host "10. List filtered tasks"
curl.exe -s "$baseUrl/api/tasks?projectId=$projectId&status=todo" @authArgs
Write-Host "`n"

Write-Host "11. Update and delete task"
Invoke-CurlJson -Method 'PATCH' -Url "$baseUrl/api/tasks/$taskId" -Headers ($authArgs + $contentArgs) -Body @{ status = 'done' }
Write-Host "`n"
curl.exe -s -X DELETE "$baseUrl/api/tasks/$taskId" @authArgs
Write-Host "`n"

Write-Host "12. Update and delete project"
Invoke-CurlJson -Method 'PATCH' -Url "$baseUrl/api/projects/$projectId" -Headers ($authArgs + $contentArgs) -Body @{ status = 'active'; progress = 10 }
Write-Host "`n"
curl.exe -s -X DELETE "$baseUrl/api/projects/$projectId" @authArgs
Write-Host "`n"

Write-Host "13. Logout"
curl.exe -s -X POST "$baseUrl/api/auth/logout"
Write-Host "`nE2E curl flow completed."