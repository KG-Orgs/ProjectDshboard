$utf8File = "C:\Users\georg\ProjectDshboard\packages\backend\eval\mlj017-smoke-v2-post-docx-dedup-v2-utf8.txt"
$lines = [System.IO.File]::ReadAllLines($utf8File)
Write-Host "Lines: $($lines.Count)"

# Parse each [sqNN] block
$results = [ordered]@{}
$curSq = $null
$curQuestion = ""
$inAnswer = $false

for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]

    # Detect question header
    if ($line -match '^\[sq(\d+)\]') {
        $curSq = "sq{0:D2}" -f [int]$matches[1]
        $curQuestion = ""
        $inAnswer = $false
        if (-not $results.Contains($curSq)) {
            $results[$curSq] = "ANSWERED"
        }
    }

    # Capture question text (line after [sqNN])
    if ($curSq -and $line -notmatch '^\[sq\d+\]' -and $line -notmatch '^={10}' -and $line.Trim() -ne "" -and $curQuestion -eq "") {
        $curQuestion = $line.Trim()
    }

    # Detect NOT INDEXED
    if ($curSq -and $line -match 'NOT INDEXED') {
        $results[$curSq] = "NOT_INDEXED"
    }

    # Detect no-answer patterns (only if not already flagged)
    if ($curSq -and $results[$curSq] -eq "ANSWERED") {
        if ($line -match "I could not find|No evidence|no exact indexed|unable to (find|locate)|not (find|locate) any") {
            $results[$curSq] = "NO_ANSWER"
        }
    }
}

Write-Host ""
Write-Host "=== SUMMARY ==="
$notIndexed = @($results.GetEnumerator() | Where-Object { $_.Value -eq "NOT_INDEXED" })
$noAnswer   = @($results.GetEnumerator() | Where-Object { $_.Value -eq "NO_ANSWER" })
$answered   = @($results.GetEnumerator() | Where-Object { $_.Value -eq "ANSWERED" })

Write-Host "ANSWERED:    $($answered.Count)"
Write-Host "NO_ANSWER:   $($noAnswer.Count)"
Write-Host "NOT_INDEXED: $($notIndexed.Count)"
Write-Host "TOTAL:       $($results.Count)"

Write-Host ""
Write-Host "=== NOT INDEXED ==="
$notIndexed | Sort-Object Key | ForEach-Object { $_.Key }

Write-Host ""
Write-Host "=== NO ANSWER ==="
$noAnswer | Sort-Object Key | ForEach-Object { $_.Key }

Write-Host ""
Write-Host "=== ALL RESULTS ==="
$results.GetEnumerator() | ForEach-Object { "$($_.Key): $($_.Value)" }
