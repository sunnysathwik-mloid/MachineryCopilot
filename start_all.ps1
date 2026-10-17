Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Starting MachineryCopilot Full Stack Environment" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan

$workspace = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "`n[1/2] Starting FastAPI Backend on http://localhost:8000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$workspace\backend'; python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

Write-Host "[2/2] Starting React Frontend on http://localhost:5173 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$workspace\frontend'; npm run dev"

Write-Host "`nMachineryCopilot is starting up!" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "  Backend API: http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "========================================================`n" -ForegroundColor Cyan
