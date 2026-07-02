# SANAD Publication Readiness Verifier
# Run from the project root AFTER rotating credentials and updating .env
# Usage: .\verify-and-publish.ps1

param(
  [switch]$SkipSeed,   # pass -SkipSeed if DB is already seeded and you're re-running
  [switch]$DryRun      # pass -DryRun to skip the push commands at the end
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$harnesses = Join-Path $root "scripts\harnesses"
$allPassed = $true

function Step($n, $label) { Write-Host "`n[$n]  $label" -ForegroundColor Cyan }
function Pass($msg) { Write-Host "     PASS  $msg" -ForegroundColor Green }
function Fail($msg) { Write-Host "     FAIL  $msg" -ForegroundColor Red; $script:allPassed = $false }
function Info($msg) { Write-Host "     INFO  $msg" -ForegroundColor DarkGray }

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║   SANAD  ·  Publication Readiness Gate   ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════════╝" -ForegroundColor Cyan

# ── Step 1: .env validation ────────────────────────────────────────────────────
Step "1/5" ".env credential check"

$envFile = Join-Path $root ".env"
if (-not (Test-Path $envFile)) {
  Fail ".env not found — copy .env.example and fill in rotated credentials"
  exit 1
}

$env_content = Get-Content $envFile -Raw

# Detect placeholder values from .env.example
$placeholders = @(
  "postgresql://user:password@host",
  "change-me-to-a-long-random-secret",
  "sk-\.\.\.",
  "GEMINI_API_KEY=\.\.\."
)
$foundPlaceholder = $false
foreach ($p in $placeholders) {
  if ($env_content -match $p) { $foundPlaceholder = $true; break }
}

if ($foundPlaceholder) {
  Fail ".env still contains placeholder values — rotate credentials before publishing"
  Info "Required: DATABASE_URL (Neon), OPENAI_API_KEY, GEMINI_API_KEY, JWT_SECRET (>=64 chars)"
  exit 1
}

# Check JWT_SECRET length
$jwtLine = ($env_content -split "`n") | Where-Object { $_ -match "^JWT_SECRET=" } | Select-Object -First 1
$jwtSecret = ($jwtLine -replace "^JWT_SECRET=", "").Trim()
if ($jwtSecret.Length -lt 64) {
  Fail "JWT_SECRET is only $($jwtSecret.Length) chars — generate with: node -e `"console.log(require('crypto').randomBytes(64).toString('hex'))`""
  exit 1
}

Pass "Credentials look rotated (JWT_SECRET: $($jwtSecret.Length) chars)"

# ── Step 2: API server liveness ────────────────────────────────────────────────
Step "2/5" "API server liveness check (port 8080)"

try {
  $livez = Invoke-WebRequest -Uri "http://127.0.0.1:8080/api/livez" -TimeoutSec 5 -UseBasicParsing
  if ($livez.StatusCode -eq 200) {
    Pass "API server responding on :8080"
  } else {
    Fail "API server returned $($livez.StatusCode) — expected 200"
    exit 1
  }
} catch {
  Fail "API server not reachable on :8080 — start it with: pnpm --filter @workspace/api-server dev"
  exit 1
}

# ── Step 3: Database seed ──────────────────────────────────────────────────────
Step "3/5" "Database seed"

if ($SkipSeed) {
  Info "Skipping seed (-SkipSeed flag set)"
} else {
  Info "Running: pnpm --filter @workspace/scripts seed"
  Push-Location $root
  # cmd /c with merged stderr — PS 5.1 + ErrorActionPreference=Stop would otherwise
  # turn benign node stderr warnings (e.g. pg SSL-mode notice) into a fatal error
  & cmd /c "pnpm --filter @workspace/scripts seed 2>&1"
  $seedExit = $LASTEXITCODE
  Pop-Location
  if ($seedExit -ne 0) {
    Fail "Seed failed (exit $seedExit) — check DATABASE_URL and Neon connectivity"
    exit 1
  }
  Pass "Seed completed"
}

# ── Step 4: scenario-tests (46 assertions) ─────────────────────────────────────
Step "4/5" "scenario-tests.mjs  (46 assertions — S1–S7 + JWT refresh)"

$scenarioScript = Join-Path $harnesses "scenario-tests.mjs"
$s = Start-Process -FilePath "node" `
  -ArgumentList $scenarioScript `
  -WorkingDirectory $root `
  -Wait -PassThru -NoNewWindow
if ($s.ExitCode -ne 0) {
  Fail "scenario-tests had failures (exit $($s.ExitCode))"
  $allPassed = $false
} else {
  Pass "scenario-tests  46/46"
}

# ── Step 5: ownership-tests (42 assertions) ────────────────────────────────────
Step "5/5" "ownership-tests.mjs  (42 assertions — BOLA trust boundaries + hospital scoping)"

$ownershipScript = Join-Path $harnesses "ownership-tests.mjs"
$o = Start-Process -FilePath "node" `
  -ArgumentList $ownershipScript `
  -WorkingDirectory $root `
  -Wait -PassThru -NoNewWindow
  if ($o.ExitCode -ne 0) {
    Fail "ownership-tests had failures (exit $($o.ExitCode))"
    $allPassed = $false
  } else {
    Pass "ownership-tests  all assertions green (count printed above)"
  }

# ── Browser flows (manual — require pnpm dev on :3001) ────────────────────────
Write-Host ""
Write-Host "  ── Browser flows (run manually with both servers up) ──────" -ForegroundColor DarkYellow
$shots = "$env:TEMP\sanad-shots"
Write-Host "     node `"$shots\doctor-flow.mjs`"" -ForegroundColor DarkCyan
Write-Host "     node `"$shots\citizen-flow.mjs`"" -ForegroundColor DarkCyan
Write-Host "     node `"$shots\family-flow.mjs`"" -ForegroundColor DarkCyan

# ── Result ─────────────────────────────────────────────────────────────────────
Write-Host ""
if ($allPassed) {
  Write-Host "  ╔══════════════════════════════════════╗" -ForegroundColor Green
  Write-Host "  ║   ALL CHECKS PASSED — READY TO PUSH  ║" -ForegroundColor Green
  Write-Host "  ╚══════════════════════════════════════╝" -ForegroundColor Green
  Write-Host ""

  if ($DryRun) {
    Write-Host "  (dry run — push commands printed but not executed)" -ForegroundColor DarkGray
  }

  Write-Host "  Run these two commands to publish:" -ForegroundColor White
  Write-Host ""
  Write-Host "    git push -u sanad-final main" -ForegroundColor Cyan
  Write-Host "    git push sanad-final demo-ready-v3" -ForegroundColor Cyan
  Write-Host ""
} else {
  Write-Host "  ╔═══════════════════════════════════╗" -ForegroundColor Red
  Write-Host "  ║   CHECKS FAILED — DO NOT PUSH YET  ║" -ForegroundColor Red
  Write-Host "  ╚═══════════════════════════════════╝" -ForegroundColor Red
  Write-Host ""
  exit 1
}
