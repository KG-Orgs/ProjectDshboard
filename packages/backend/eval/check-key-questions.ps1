$file = "C:\Users\georg\ProjectDshboard\packages\backend\eval\mlj017-smoke-v2-post-docx-dedup-v2-utf8.txt"
$lines = [System.IO.File]::ReadAllLines($file)

$targets = @("sq09","sq10","sq34")
$capture = $false
$curSq = ""
$buf = [System.Collections.Generic.List[string]]::new()

foreach ($l in $lines) {
    if ($l -match '^\[(sq\d+)\]') {
        $sq = $matches[1]
        if ($capture) {
            # flush previous
            Write-Host "===== $curSq ====="
            $buf | Select-Object -First 35
            Write-Host ""
            $buf.Clear()
            $capture = $false
        }
        if ($targets -contains $sq) {
            $capture = $true
            $curSq = $sq
            $buf.Add($l)
        }
        continue
    }
    if ($capture) { $buf.Add($l) }
}
if ($capture -and $buf.Count -gt 0) {
    Write-Host "===== $curSq ====="
    $buf | Select-Object -First 35
}
