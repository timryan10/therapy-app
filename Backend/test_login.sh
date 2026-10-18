#!/bin/bash
set -e

echo "--- Login existing patient (alice.j@example.com) ---"
curl -s -X POST http://localhost:4000/auth/patient-login -H "Content-Type: application/json" -d '{"username":"alice.j@example.com","password":"AliceJohnson"}' -w "\nHTTP_STATUS:%{http_code}\n"

echo "\n--- Create new patient (Test Patient) ---"
curl -s -X POST http://localhost:4000/patients -H "Content-Type: application/json" -d '{"firstName":"Test","lastName":"Patient","contact":"test.patient@example.com"}' -w "\nHTTP_STATUS:%{http_code}\n"

echo "\n--- Login new patient (test.patient@example.com) ---"
curl -s -X POST http://localhost:4000/auth/patient-login -H "Content-Type: application/json" -d '{"username":"test.patient@example.com","password":"TestPatient"}' -w "\nHTTP_STATUS:%{http_code}\n"

echo "\n--- New patient record from patients.json ---"
node -e "console.log(JSON.stringify(JSON.parse(require('fs').readFileSync('patients.json','utf8')).filter(p=>p.contact==='test.patient@example.com'),null,2))"
