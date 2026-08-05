#!/usr/bin/env pwsh
<#
  reindex-pdf-shards.ps1 — runs all 10 zero-chunk PDF shards in batches of 4.
  Automatically retries OOM'd shards. Work is never lost between runs because
  chunkCount is now updated inside the replaceFileChunks transaction.

  Usage (from packages/backend):
    pwsh ./scripts/reindex-pdf-shards.ps1
    pwsh ./scripts/reindex-pdf-shards.ps1 -ParallelShards 3
#>

param(
    [int]$ParallelShards = 4,
    [int]$TotalShards    = 10,
    [int]$HeapMB         = 4096,
    [int]$MaxRounds      = 40
)

$corpus  = "C:\Users\georg\Iovino Enterprises, LLC\MLJ-017 Package 6 - General"
$project = "145b3dcf-272e-4c45-9e19-953f20f25bb9"
$backend = Split-Path $PSScriptRoot -Parent
$evalDir = Join-Path $backend "eval"
Set-Location $backend

function Get-Remaining([int]$k) {
    $lines = & pnpm tier2:stream -- --corpus $corpus --project-id $project `
        --reindex-zero-chunks --filter-ext pdf --shard "$k/$TotalShards" `
        --concurrency 1 --dry-run 2>&1
    $line = $lines | Select-String "to index" | Select-Object -First 1 -ExpandProperty Line
    if ($line -match "(\d+) to index") { return [int]$Matches[1] }
    return 0
}

function Run-Batch([int[]]$shards) {
    $jobs = @{}
    foreach ($k in $shards) {
        $outFile = Join-Path $evalDir "reindex-pdf-shard${k}.txt"
        $jobs[$k] = Start-Job -Name "shard${k}" -ScriptBlock {
            param($k,$corpus,$project,$total,$backend,$out,$heap)
            $env:NODE_OPTIONS = "--max-old-space-size=$heap"
            Set-Location $backend
            & pnpm tier2:stream -- --corpus $corpus --project-id $project `
                --reindex-zero-chunks --filter-ext pdf `
                --shard "$k/$total" --concurrency 1 2>&1 | Out-File -Encoding utf8 $out
            $LASTEXITCODE
        } -ArgumentList $k,$corpus,$project,$TotalShards,$backend,$outFile,$HeapMB
        Write-Host "  [shard $k] started"
    }
    $results = @{}
    foreach ($k in $shards) {
        $null = Wait-Job $jobs[$k]
        $code  = Receive-Job $jobs[$k] 2>$null
        $results[$k] = if ($null -eq $code) { 134 } else { [int]$code }
        Remove-Job $jobs[$k] -Force
        $f = Join-Path $evalDir "reindex-pdf-shard${k}.txt"
        $last = if (Test-Path $f) { (Select-String -Path $f -Pattern "^\[w\d+ \d+/\d+\]" | Select-Object -Last 1).Line } else { "?" }
        Write-Host "  [shard $k] exit=$($results[$k])  $last"
    }
    return $results
}

$pending = [System.Collections.Generic.HashSet[int]]::new()
0..($TotalShards-1) | ForEach-Object { [void]$pending.Add($_) }

Write-Host "`n=== reindex-pdf-shards  parallel=$ParallelShards  heap=${HeapMB}MB ===" -ForegroundColor Cyan

$round = 0
while ($pending.Count -gt 0 -and $round -lt $MaxRounds) {
    $round++
    $batch = @($pending | Select-Object -First $ParallelShards)
    Write-Host "`n[round $round] shards $($batch -join ',')  ($($pending.Count) left)" -ForegroundColor Cyan

    $results = Run-Batch $batch

    foreach ($k in $batch) {
        $ex  = $results[$k]
        $f   = Join-Path $evalDir "reindex-pdf-shard${k}.txt"
        $ntd = (Test-Path $f) -and (Select-String -Path $f -Pattern "Nothing to do" -Quiet)
        if ($ntd -or $ex -eq 0) {
            $rem = Get-Remaining $k
            if ($rem -eq 0) {
                Write-Host "  [shard $k] DONE" -ForegroundColor Green
                [void]$pending.Remove($k)
            } else {
                Write-Host "  [shard $k] exit=0 but $rem remain — retry" -ForegroundColor Yellow
            }
        } else {
            $rem = Get-Remaining $k
            Write-Host "  [shard $k] exit=$ex  $rem remain — retry next round" -ForegroundColor Yellow
        }
    }
    if ($pending.Count -gt 0) { Start-Sleep -Seconds 3 }
}

if ($pending.Count -eq 0) {
    Write-Host "`n=== ALL DONE ===" -ForegroundColor Green
} else {
    Write-Host "`n=== $($pending.Count) shards still pending — re-run script ===" -ForegroundColor Yellow
}
