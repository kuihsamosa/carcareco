#!/bin/bash
set -e

DB="carcare"
USER="carcare"
HOST="localhost"
OUT=~/Desktop/carcare_data.sql

echo "Exporting data from $DB..."

pg_dump -U $USER -h $HOST -d $DB \
  --data-only \
  --disable-triggers \
  --table=domain.employee \
  --table=domain.vehicle \
  --table=domain.client \
  --table=domain.privateclient \
  --table=domain.legalclient \
  --table=domain.clientemail \
  --table=domain.vehicleregistration \
  --table=domain.saleable \
  --table=domain.sparepart \
  --table=domain.storage \
  --table=domain.unitedmotorsprice \
  --table=domain.pricing \
  --table=domain.pricingline \
  --table=domain.invoice \
  --table=domain.work \
  --table=domain.assignment \
  --table=domain.repairjob \
  --table=domain.serviceperformed \
  --table=domain.productinstalled \
  --table=domain.estimate \
  --table=domain.offer \
  --table=domain.serviceoffered \
  --table=domain.productoffered \
  --table=domain.partialpayment \
  --table=public.user \
  -F p -f $OUT

echo "Done. File saved to $OUT"
echo "Copy carcare_data.sql to C:\\ on Windows, then run: scripts\\restore-data.ps1"
