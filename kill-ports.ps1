# Kill all processes on DirectorByte dev ports
Write-Host "Killing processes on ports 3000 and 4000..." -ForegroundColor Yellow

$ports = @(3000, 4000, 4001)
foreach ($port in $ports) {
    $connections = netstat -ano | Select-String ":$port " | Select-String "LISTENING"
    foreach ($line in $connections) {
        $parts = $line.ToString().Trim() -split '\s+'
        $foundPid = $parts[-1]
        if ($foundPid -match '^\d+$' -and $foundPid -ne '0') {
            try {
                taskkill /PID $foundPid /F 2>$null
                Write-Host "  Killed PID $foundPid on port $port" -ForegroundColor Green
            } catch {
                Write-Host "  Could not kill PID $foundPid" -ForegroundColor Red
            }
        }
    }
}

Write-Host "Done. Run 'npm run dev' now." -ForegroundColor Cyan
