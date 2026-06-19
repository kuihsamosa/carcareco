# Restore CarCareCo data into Docker database
# Usage: .\scripts\restore-data.ps1
# Place carcare_data.sql at C:\carcare_data.sql before running

$SqlFile = "C:\carcare_data.sql"
$Container = "carcareco-db-1"
$DB = "carcare"
$User = "carcare"

if (-not (Test-Path $SqlFile)) {
    Write-Host "ERROR: $SqlFile not found. Copy carcare_data.sql to C:\ first." -ForegroundColor Red
    exit 1
}

Write-Host "Step 1/3 - Clearing existing data..." -ForegroundColor Cyan

$tables = @(
    "domain.partialpayment",
    "domain.assignment",
    "domain.serviceperformed",
    "domain.productinstalled",
    "domain.repairjob",
    "domain.work",
    "domain.invoice",
    "domain.pricingline",
    "domain.pricing",
    "domain.vehicleregistration",
    "domain.clientemail",
    "domain.legalclient",
    "domain.privateclient",
    "domain.client",
    "domain.vehicle",
    "domain.employee",
    "domain.saleable",
    "domain.estimate",
    "domain.offer",
    "domain.serviceoffered",
    "domain.productoffered",
    "domain.sparepart",
    "domain.storage",
    "domain.unitedmotorsprice",
    "public.user"
)

foreach ($table in $tables) {
    docker exec $Container psql -U $User -d $DB -c "TRUNCATE $table CASCADE;" 2>$null
}

Write-Host "Step 2/3 - Restoring data..." -ForegroundColor Cyan
cmd /c "docker exec -i $Container psql -U $User -d $DB < $SqlFile"

Write-Host "Step 3/3 - Verifying..." -ForegroundColor Cyan
$count = docker exec $Container psql -U $User -d $DB -t -c "SELECT COUNT(*) FROM domain.invoice;"
Write-Host "Invoices restored: $($count.Trim())" -ForegroundColor Green

$clientCount = docker exec $Container psql -U $User -d $DB -t -c "SELECT COUNT(*) FROM domain.client;"
Write-Host "Clients restored:  $($clientCount.Trim())" -ForegroundColor Green

Write-Host ""
Write-Host "Done! Open http://localhost:3000" -ForegroundColor Green
