
<#
.SYNOPSIS
Parses mlj017-smoke-v3-raw-output.txt + mlj017-smoke-questions-v3.json
and writes mlj017-smoke-questions-v3-results.md
#>

$rawPath  = "$PSScriptRoot\mlj017-smoke-v3-raw-output.txt"
$jsonPath = "$PSScriptRoot\mlj017-smoke-questions-v3.json"
$outPath  = "$PSScriptRoot\mlj017-smoke-questions-v3-results.md"

# ── Load inputs ──────────────────────────────────────────────────────────────
$raw  = Get-Content $rawPath -Encoding Unicode -Raw
$suite = Get-Content $jsonPath -Raw | ConvertFrom-Json

# ── Build lookup: id → suite entry ───────────────────────────────────────────
$lookup = @{}
foreach ($q in $suite) { $lookup[$q.id] = $q }

# ── Split into per-question blocks ───────────────────────────────────────────
$sep   = '=' * 72
$blocks = $raw -split "(?m)^={72}$" | Where-Object { $_ -match '\[v3-' }

# ── Parser helpers ────────────────────────────────────────────────────────────
function Parse-Block($block) {
    $result = @{
        id        = ''
        query     = ''
        answer    = ''
        sources   = @()
        citations = @()
        elapsed   = ''
        domains   = ''
        cacheHit  = ''
    }

    # id + query from first non-empty lines
    $headerLines = ($block -split "`n") | Where-Object { $_.Trim() -ne '' } | Select-Object -First 2
    if ($headerLines[0] -match '\[([^\]]+)\]') { $result.id = $Matches[1] }
    $result.query = ($headerLines | Where-Object { $_ -notmatch '^\[v3-' } | Select-Object -First 1).Trim()
    # Some queries span the same line as [id] or the next
    if ($block -match '\[v3-[^\]]+\]\s*\n\s*(.+)') { $result.query = $Matches[1].Trim() }
    if ($block -match '\[v3-[^\]]+\]:\s*(.+)') { $result.query = $Matches[1].Trim() }

    # Answer section
    if ($block -match '(?s)--- ANSWER ---\s*\n(.+?)(?=--- SOURCES ---|--- META ---|$)') {
        $result.answer = $Matches[1].Trim()
        # Strip trailing JSON log lines
        $result.answer = ($result.answer -split "`n" | Where-Object { $_ -notmatch '^\{"timestamp"' }) -join "`n"
        $result.answer = $result.answer.Trim()
    }

    # Sources section
    if ($block -match '(?s)--- SOURCES ---\s*\n(.+?)(?=--- CITATIONS ---|--- META ---|$)') {
        $srcBlock = $Matches[1]
        $srcLines = $srcBlock -split "`n" | Where-Object { $_.Trim() -ne '' -and $_ -notmatch '^\{"timestamp"' }
        $currentFile = ''
        foreach ($line in $srcLines) {
            if ($line -match '^\s{0,4}-\s+(.+)') {
                $currentFile = $Matches[1].Trim()
                $result.sources += $currentFile
            }
        }
    }

    # Citations section
    if ($block -match '(?s)--- CITATIONS ---\s*\n(.+?)(?=--- META ---|$)') {
        $citBlock = $Matches[1]
        $citLines = $citBlock -split "`n" | Where-Object { $_.Trim() -ne '' -and $_ -notmatch '^\{"timestamp"' }
        foreach ($line in $citLines) {
            if ($line -match '^\s*-\s+(.+)') {
                $result.citations += $Matches[1].Trim()
            }
        }
    }

    # META line
    if ($block -match '--- META --- elapsed=(\d+)ms domains=([^ ]+) cacheHit=(\w+)') {
        $result.elapsed  = $Matches[1]
        $result.domains  = $Matches[2]
        $result.cacheHit = $Matches[3]
    }

    return $result
}

# ── Evaluate pass/fail ────────────────────────────────────────────────────────
function Evaluate($parsed, $suite) {
    $verdict = 'UNKNOWN'
    $reason  = ''

    # Binary/manual check
    if ($suite.acceptableAnswerContains.Count -eq 0 -and $suite.expectedFilePatterns.Count -eq 0) {
        return @{ verdict = 'MANUAL'; reason = 'Binary-chunk content — manual validation required' }
    }

    # Check if expected file patterns appear in sources
    $sourceHit   = $false
    $topSourceHit = $false
    $firstSource = if ($parsed.sources.Count -gt 0) { $parsed.sources[0] } else { '' }

    foreach ($pat in $suite.expectedFilePatterns) {
        $regex = $pat.Replace('*','.*').Replace('?','.')
        if ($parsed.sources | Where-Object { $_ -match $regex }) { $sourceHit = $true }
        if ($firstSource -match $regex) { $topSourceHit = $true }
    }

    # Check answer content
    $answerHit = $true
    if ($suite.acceptableAnswerContains.Count -gt 0) {
        $answerHit = $false
        foreach ($phrase in $suite.acceptableAnswerContains) {
            if ($parsed.answer -match [regex]::Escape($phrase)) { $answerHit = $true; break }
        }
    }

    if ($topSourceHit -and $answerHit) {
        $verdict = 'PASS'
        $reason  = "Correct source retrieved at top rank; answer contains expected content."
    } elseif ($sourceHit -and $answerHit) {
        $verdict = 'PARTIAL'
        $reason  = "Correct source retrieved but not ranked first; answer content found."
    } elseif ($topSourceHit -and -not $answerHit) {
        $verdict = 'PARTIAL'
        $reason  = "Correct source at top rank but answer did not contain expected phrases."
    } elseif ($sourceHit -and -not $answerHit) {
        $verdict = 'PARTIAL'
        $reason  = "Expected source retrieved but not ranked first, and answer content missing."
    } else {
        $verdict = 'FAIL'
        if ($parsed.sources.Count -eq 0) {
            $reason = "No sources retrieved."
        } else {
            $reason = "Expected source not found in retrieved set. Top source: $firstSource"
        }
        if ($suite.acceptableAnswerContains.Count -gt 0 -and -not $answerHit) {
            $reason += " Answer did not contain expected phrases."
        }
    }

    return @{ verdict = $verdict; reason = $reason }
}

# ── Parse all blocks ──────────────────────────────────────────────────────────
$results = @()
foreach ($block in $blocks) {
    $p = Parse-Block $block
    if (-not $p.id) { continue }
    $s = $lookup[$p.id]
    if (-not $s) { Write-Warning "No suite entry for id=$($p.id)"; continue }
    $ev = Evaluate $p $s
    $results += [PSCustomObject]@{
        id          = $p.id
        category    = $s.category
        questionNum = $s.questionNumber
        query       = $p.query
        answer      = $p.answer
        sources     = $p.sources
        citations   = $p.citations
        elapsed     = $p.elapsed
        domains     = $p.domains
        cacheHit    = $p.cacheHit
        expected    = $s.expectedFilePatterns
        acceptable  = $s.acceptableAnswerContains
        bucket      = $s.bucket
        verdict     = $ev.verdict
        reason      = $ev.reason
    }
}

Write-Host "Parsed $($results.Count) results"

# ── Summary stats ─────────────────────────────────────────────────────────────
$pass    = ($results | Where-Object verdict -eq 'PASS').Count
$partial = ($results | Where-Object verdict -eq 'PARTIAL').Count
$fail    = ($results | Where-Object verdict -eq 'FAIL').Count
$manual  = ($results | Where-Object verdict -eq 'MANUAL').Count

# Category breakdown
$categories = $results | Group-Object category | Sort-Object Name

# ── Verdict emoji ─────────────────────────────────────────────────────────────
function Emoji($v) {
    switch ($v) {
        'PASS'    { return '✅ PASS' }
        'PARTIAL' { return '⚠️ PARTIAL' }
        'FAIL'    { return '❌ FAIL' }
        'MANUAL'  { return '🔍 MANUAL' }
        default   { return $v }
    }
}

# ── Build markdown ────────────────────────────────────────────────────────────
$md = [System.Text.StringBuilder]::new()

$null = $md.AppendLine("# MLJ-017 Smoke Test v3 — Results Report")
$null = $md.AppendLine("")
$null = $md.AppendLine("**Project:** MLJ-017 Package 6 - General (TEST CLONE)")
$null = $md.AppendLine("**Project ID:** ``731cfd5d-e647-4551-89e7-0a3cc4915115``")
$null = $md.AppendLine("**Run date:** $(Get-Date -Format 'yyyy-MM-dd')")
$null = $md.AppendLine("**Total questions:** 54 | **Retrieval mode:** Hybrid (RETRIEVAL_HYBRID_ENABLED=true) | **Reranking:** Disabled")
$null = $md.AppendLine("")

# Summary table
$null = $md.AppendLine("## Summary")
$null = $md.AppendLine("")
$null = $md.AppendLine("| Verdict | Count | % |")
$null = $md.AppendLine("|---------|-------|---|")
$total = $results.Count
$null = $md.AppendLine("| ✅ PASS | $pass | $([math]::Round($pass/$total*100,0))% |")
$null = $md.AppendLine("| ⚠️ PARTIAL | $partial | $([math]::Round($partial/$total*100,0))% |")
$null = $md.AppendLine("| ❌ FAIL | $fail | $([math]::Round($fail/$total*100,0))% |")
$null = $md.AppendLine("| 🔍 MANUAL | $manual | $([math]::Round($manual/$total*100,0))% |")
$null = $md.AppendLine("| **Total** | **$total** | **100%** |")
$null = $md.AppendLine("")

# Category breakdown
$null = $md.AppendLine("## Results by Category")
$null = $md.AppendLine("")
$null = $md.AppendLine("| Category | Total | ✅ PASS | ⚠️ PARTIAL | ❌ FAIL | 🔍 MANUAL |")
$null = $md.AppendLine("|----------|-------|---------|-----------|--------|----------|")
foreach ($cat in $categories) {
    $items = $cat.Group
    $cPass    = ($items | Where-Object verdict -eq 'PASS').Count
    $cPartial = ($items | Where-Object verdict -eq 'PARTIAL').Count
    $cFail    = ($items | Where-Object verdict -eq 'FAIL').Count
    $cManual  = ($items | Where-Object verdict -eq 'MANUAL').Count
    $cLabel   = $cat.Name -replace '_',' '
    $null = $md.AppendLine("| $cLabel | $($items.Count) | $cPass | $cPartial | $cFail | $cManual |")
}
$null = $md.AppendLine("")

# Notable failures list
$failures = $results | Where-Object { $_.verdict -in 'FAIL','PARTIAL' }
if ($failures.Count -gt 0) {
    $null = $md.AppendLine("## Notable Failures & Partials")
    $null = $md.AppendLine("")
    $null = $md.AppendLine("| ID | Category | Verdict | Reason |")
    $null = $md.AppendLine("|----|----------|---------|--------|")
    foreach ($r in $failures) {
        $reasonShort = if ($r.reason.Length -gt 120) { $r.reason.Substring(0,117) + '...' } else { $r.reason }
        $null = $md.AppendLine("| $($r.id) | $($r.category -replace '_',' ') | $(Emoji $r.verdict) | $reasonShort |")
    }
    $null = $md.AppendLine("")
}

# ── Per-question detail ───────────────────────────────────────────────────────
$null = $md.AppendLine("---")
$null = $md.AppendLine("")
$null = $md.AppendLine("## Detailed Results")
$null = $md.AppendLine("")

foreach ($cat in $categories) {
    $catLabel = ($cat.Name -replace '_',' ').ToUpper()
    $null = $md.AppendLine("### Category: $catLabel")
    $null = $md.AppendLine("")

    foreach ($r in ($cat.Group | Sort-Object questionNum)) {
        $verdictLabel = Emoji $r.verdict

        $null = $md.AppendLine("#### Q$($r.questionNum) — ``$($r.id)`` — $verdictLabel")
        $null = $md.AppendLine("")
        $null = $md.AppendLine("**Question:** $($r.query)")
        $null = $md.AppendLine("")

        # Answer (clean up excess blank lines)
        $answerClean = ($r.answer -split "`n" | ForEach-Object { $_.TrimEnd() }) -join "`n"
        $answerClean = [regex]::Replace($answerClean, "(`n){3,}", "`n`n")
        $null = $md.AppendLine("**Answer:**")
        $null = $md.AppendLine("")
        $null = $md.AppendLine($answerClean)
        $null = $md.AppendLine("")

        # How the agent got there
        $null = $md.AppendLine("**How the agent got there:**")
        $null = $md.AppendLine("")
        if ($r.sources.Count -gt 0) {
            $null = $md.AppendLine("Retrieved sources (in retrieval order):")
            $null = $md.AppendLine("")
            foreach ($src in $r.sources) {
                $null = $md.AppendLine("- ``$src``")
            }
            $null = $md.AppendLine("")
        }
        if ($r.citations.Count -gt 0) {
            $null = $md.AppendLine("Top-ranked citations:")
            $null = $md.AppendLine("")
            foreach ($cit in $r.citations) {
                $null = $md.AppendLine("- $cit")
            }
            $null = $md.AppendLine("")
        }
        $metaParts = @()
        if ($r.domains)  { $metaParts += "Domain routing: **$($r.domains)**" }
        if ($r.elapsed)  { $metaParts += "Elapsed: **$($r.elapsed) ms**" }
        if ($r.cacheHit) { $metaParts += "Cache hit: **$($r.cacheHit)**" }
        if ($metaParts.Count -gt 0) {
            $null = $md.AppendLine($metaParts -join " | ")
            $null = $md.AppendLine("")
        }

        # Verdict
        $null = $md.AppendLine("**Verdict:** $verdictLabel — $($r.reason)")
        $null = $md.AppendLine("")
        if ($r.expected.Count -gt 0) {
            $null = $md.AppendLine("*Expected file patterns:* $($r.expected -join ', ')*")
            $null = $md.AppendLine("")
        }
        if ($r.acceptable.Count -gt 0) {
            $null = $md.AppendLine("*Expected answer to contain:* $($r.acceptable -join ', ')*")
            $null = $md.AppendLine("")
        }

        $null = $md.AppendLine("---")
        $null = $md.AppendLine("")
    }
}

# ── Write output ──────────────────────────────────────────────────────────────
$md.ToString() | Out-File $outPath -Encoding UTF8
Write-Host "Report written to: $outPath"
Write-Host "PASS=$pass PARTIAL=$partial FAIL=$fail MANUAL=$manual"
