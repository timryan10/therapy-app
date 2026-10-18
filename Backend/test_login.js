(async () => {
  const base = 'http://localhost:4000';
  try {
    console.log('\n--- Login existing patient (alice.j@example.com) ---');
    let r = await fetch(`${base}/auth/patient-login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'alice.j@example.com', password: 'AliceJohnson' }) });
    console.log('status', r.status);
    console.log(await r.text());

    console.log('\n--- Create new patient (Test Patient) ---');
    r = await fetch(`${base}/patients`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firstName: 'Test', lastName: 'Patient', contact: 'test.patient@example.com' }) });
    console.log('status', r.status);
    const created = await r.json().catch(() => null);
    console.log('created:', created);

    console.log('\n--- Login new patient (test.patient@example.com) ---');
    r = await fetch(`${base}/auth/patient-login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'test.patient@example.com', password: 'TestPatient' }) });
    console.log('status', r.status);
    console.log(await r.text());

    console.log('\n--- New patient record from patients.json ---');
    const fs = require('fs');
    const patients = JSON.parse(fs.readFileSync('patients.json','utf8'));
    console.log(JSON.stringify(patients.filter(p=>p.contact==='test.patient@example.com'), null, 2));
  } catch (e) {
    console.error('ERROR', e);
  }
})();
