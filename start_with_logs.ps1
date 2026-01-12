# Strongly-logged startup for the Dash app (Windows PowerShell)
# - Kills any running python
# - Ensures unbuffered UTF-8 logging
# - Writes console output to app_run.log while also showing it on screen

try {
  # Move to the script directory (project root)
  Set-Location -Path $PSScriptRoot

  # UTF-8 and unbuffered stdout
  $env:PYTHONUNBUFFERED = "1"
  $env:PYTHONIOENCODING = "utf-8"
  [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)

  # Ensure vision behavior aligns with requested configuration each run
  # - Enable extra vision fallbacks
  # - Increase IO timeout for slower vision models
  # - Optionally pin primary/fallback models for this session
  if (-not $env:IO_ENABLE_EXTRA_VISION_FALLBACKS) { $env:IO_ENABLE_EXTRA_VISION_FALLBACKS = "1" }
  if (-not $env:IO_INTELLIGENCE_TIMEOUT) { $env:IO_INTELLIGENCE_TIMEOUT = "30" }
  if (-not $env:IO_INTELLIGENCE_MODEL) { $env:IO_INTELLIGENCE_MODEL = "Qwen/Qwen2.5-VL-32B-Instruct" }
  if (-not $env:IO_INTELLIGENCE_FALLBACK_MODEL) { $env:IO_INTELLIGENCE_FALLBACK_MODEL = "meta-llama/Llama-3.2-90B-Vision-Instruct" }
  # Force tag model per user request
  $env:IO_TAG_MODEL = "openai/gpt-oss-120b"

  # Stop any existing python processes quietly
  Get-Process -Name python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

  # Stop any previous logger shells that are still running this script (they may hold app_run.log)
  try {
    $myPid = $PID
    $prev = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
      Where-Object { ($_.CommandLine -like "*start_with_logs.ps1*") -and ($_.ProcessId -ne $myPid) }
    if ($prev) {
      $prev | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
      Start-Sleep -Milliseconds 300
    }
  } catch {}

  # Resolve python path from virtual env if available
  $pythonExe = $null
  if (Test-Path ".\.venv\Scripts\python.exe") {
    $pythonExe = ".\.venv\Scripts\python.exe"
  } elseif (Test-Path ".\venv\Scripts\python.exe") {
    $pythonExe = ".\venv\Scripts\python.exe"
  } else {
    $pythonExe = "python"
  }

  # Fresh log header (handle possible transient file locks)
  $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  for ($i = 0; $i -lt 5; $i++) {
    try {
      if (Test-Path "app_run.log") { Remove-Item -Force "app_run.log" -ErrorAction Stop }
      "==== Restart at $ts (start_with_logs.ps1) ====\n" | Out-File -FilePath app_run.log -Encoding utf8
      break
    } catch {
      Start-Sleep -Milliseconds 250
    }
  }

  # Start the app (Flask+Dash entrypoint) with live tee logging
  & $pythonExe -u server.py 2>&1 | Tee-Object -FilePath app_run.log -Append
}
catch {
  Write-Error $_
  exit 1
}

