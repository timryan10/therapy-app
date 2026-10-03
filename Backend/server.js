const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_PATH = path.join(__dirname, 'exercises.json');
const PATIENTS_PATH = path.join(__dirname, 'patients.json');
const FAVORITES_PATH = path.join(__dirname, 'favorites.json');

app.get('/exercises', (req, res) => {
  fs.readFile(DATA_PATH, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read exercises' });
    try {
      const items = JSON.parse(data);
      res.json(items);
    } catch (e) {
      res.status(500).json({ error: 'Invalid exercises data' });
    }
  });
});

// simple search endpoint: /exercises/search?q=push
app.get('/exercises/search', (req, res) => {
  const q = (req.query.q || '').toString().toLowerCase();
  fs.readFile(DATA_PATH, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read exercises' });
    const items = JSON.parse(data);
    const filtered = items.filter((it) => it.name.toLowerCase().includes(q) || (it.description || '').toLowerCase().includes(q));
    res.json(filtered);
  });
});

// create a new exercise (append to exercises.json)
app.post('/exercises', (req, res) => {
  const { name, category, description } = req.body || {};
  if (!name || typeof name !== 'string') return res.status(400).json({ error: 'Invalid name' });

  fs.readFile(DATA_PATH, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read exercises' });
    let items = [];
    try {
      items = JSON.parse(data);
    } catch (e) {
      return res.status(500).json({ error: 'Invalid exercises data' });
    }

    const newItem = {
      id: Date.now(),
      name: name.trim(),
      category: category || '',
      description: description || ''
    };
    items.push(newItem);

    fs.writeFile(DATA_PATH, JSON.stringify(items, null, 2), 'utf8', (werr) => {
      if (werr) return res.status(500).json({ error: 'Failed to save exercise' });
      res.status(201).json(newItem);
    });
  });
});

// Favorites: per-therapist personal library
app.get('/therapists/:id/favorites', (req, res) => {
  const id = req.params.id;
  fs.readFile(FAVORITES_PATH, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read favorites' });
    try {
      const items = JSON.parse(data);
      res.json(items[id] || []);
    } catch (e) {
      res.status(500).json({ error: 'Invalid favorites data' });
    }
  });
});

app.post('/therapists/:id/favorites', (req, res) => {
  const id = req.params.id;
  const exercise = req.body;
  if (!exercise || !exercise.name) return res.status(400).json({ error: 'Invalid exercise' });

  fs.readFile(FAVORITES_PATH, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read favorites' });
    let items = {};
    try {
      items = JSON.parse(data);
    } catch (e) {
      return res.status(500).json({ error: 'Invalid favorites file' });
    }

    const list = items[id] || [];
    // avoid duplicates by name
    const exists = list.some((e) => e.name === exercise.name || String(e.id) === String(exercise.id));
    if (exists) return res.status(409).json({ error: 'Already in favorites' });

    const newItem = Object.assign({ id: Date.now() }, exercise);
    items[id] = [newItem, ...list];

    fs.writeFile(FAVORITES_PATH, JSON.stringify(items, null, 2), 'utf8', (werr) => {
      if (werr) return res.status(500).json({ error: 'Failed to save favorite' });
      res.status(201).json(newItem);
    });
  });
});

app.delete('/therapists/:id/favorites/:exerciseId', (req, res) => {
  const id = req.params.id;
  const exId = req.params.exerciseId;
  fs.readFile(FAVORITES_PATH, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read favorites' });
    let items = {};
    try {
      items = JSON.parse(data);
    } catch (e) {
      return res.status(500).json({ error: 'Invalid favorites file' });
    }

    const list = items[id] || [];
    const filtered = list.filter((e) => String(e.id) !== String(exId));
    items[id] = filtered;

    fs.writeFile(FAVORITES_PATH, JSON.stringify(items, null, 2), 'utf8', (werr) => {
      if (werr) return res.status(500).json({ error: 'Failed to remove favorite' });
      res.json({ ok: true });
    });
  });
});

// patients endpoints
app.get('/patients', (req, res) => {
  fs.readFile(PATIENTS_PATH, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read patients' });
    try {
      const items = JSON.parse(data);
      res.json(items);
    } catch (e) {
      res.status(500).json({ error: 'Invalid patients data' });
    }
  });
});

app.get('/patients/search', (req, res) => {
  const q = (req.query.q || '').toString().toLowerCase();
  fs.readFile(PATIENTS_PATH, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read patients' });
    const items = JSON.parse(data);
    const filtered = items.filter((p) => {
      const full = (p.firstName + ' ' + p.lastName).toLowerCase();
      return full.includes(q) || (p.contact || '').toLowerCase().includes(q) || (p.notes || '').toLowerCase().includes(q);
    });
    res.json(filtered);
  });
});

// get single patient by id
app.get('/patients/:id', (req, res) => {
  const id = req.params.id;
  fs.readFile(PATIENTS_PATH, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read patients' });
    try {
      const items = JSON.parse(data);
      const patient = items.find((p) => p.id === id);
      if (!patient) return res.status(404).json({ error: 'Patient not found' });
      res.json(patient);
    } catch (e) {
      res.status(500).json({ error: 'Invalid patients data' });
    }
  });
});

// create a new patient
app.post('/patients', (req, res) => {
  const body = req.body || {};
  const { firstName, lastName, contact, birthdate, notes } = body;
  if (!firstName || !lastName) return res.status(400).json({ error: 'firstName and lastName required' });

  fs.readFile(PATIENTS_PATH, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read patients' });
    let items = [];
    try {
      items = JSON.parse(data);
    } catch (e) {
      return res.status(500).json({ error: 'Invalid patients data' });
    }

    const newId = `p${Date.now()}`;
    const newPatient = {
      id: newId,
      firstName: String(firstName),
      lastName: String(lastName),
      contact: contact || '',
      birthdate: birthdate || '',
      hep: body.hep || [],
      cases: body.cases || [],
      lastVisit: new Date().toISOString().slice(0,10),
      notes: notes || ''
    };

    items.push(newPatient);

    fs.writeFile(PATIENTS_PATH, JSON.stringify(items, null, 2), 'utf8', (werr) => {
      if (werr) return res.status(500).json({ error: 'Failed to save patient' });
      res.status(201).json(newPatient);
    });
  });
});

// update existing patient
app.put('/patients/:id', (req, res) => {
  const id = req.params.id;
  const body = req.body || {};
  fs.readFile(PATIENTS_PATH, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read patients' });
    let items = [];
    try {
      items = JSON.parse(data);
    } catch (e) {
      return res.status(500).json({ error: 'Invalid patients data' });
    }

    const idx = items.findIndex((p) => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Patient not found' });

    const updated = Object.assign({}, items[idx], {
      firstName: body.firstName !== undefined ? body.firstName : items[idx].firstName,
      lastName: body.lastName !== undefined ? body.lastName : items[idx].lastName,
      contact: body.contact !== undefined ? body.contact : items[idx].contact,
      birthdate: body.birthdate !== undefined ? body.birthdate : items[idx].birthdate,
      hep: body.hep !== undefined ? body.hep : (items[idx].hep || []),
      cases: body.cases !== undefined ? body.cases : (items[idx].cases || []),
      lastVisit: body.lastVisit !== undefined ? body.lastVisit : items[idx].lastVisit,
      notes: body.notes !== undefined ? body.notes : items[idx].notes,
    });

    items[idx] = updated;

    fs.writeFile(PATIENTS_PATH, JSON.stringify(items, null, 2), 'utf8', (werr) => {
      if (werr) return res.status(500).json({ error: 'Failed to update patient' });
      res.json(updated);
    });
  });
});

// --- Cases endpoints for a patient ---

// get all cases for a patient
app.get('/patients/:id/cases', (req, res) => {
  const id = req.params.id;
  fs.readFile(PATIENTS_PATH, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read patients' });
    let items = [];
    try {
      items = JSON.parse(data);
    } catch (e) {
      return res.status(500).json({ error: 'Invalid patients data' });
    }
    const patient = items.find((p) => p.id === id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient.cases || []);
  });
});

// add a new case to a patient
app.post('/patients/:id/cases', (req, res) => {
  const id = req.params.id;
  const body = req.body || {};
  if (!body.title || !Array.isArray(body.bodyParts)) return res.status(400).json({ error: 'Invalid case payload' });

  fs.readFile(PATIENTS_PATH, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read patients' });
    let items = [];
    try {
      items = JSON.parse(data);
    } catch (e) {
      return res.status(500).json({ error: 'Invalid patients data' });
    }

    const idx = items.findIndex((p) => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Patient not found' });

    const newCase = Object.assign({ id: `case-${Date.now()}`, hep: [] }, body);
    items[idx].cases = items[idx].cases || [];
    items[idx].cases.push(newCase);

    fs.writeFile(PATIENTS_PATH, JSON.stringify(items, null, 2), 'utf8', (werr) => {
      if (werr) return res.status(500).json({ error: 'Failed to save case' });
      res.status(201).json(newCase);
    });
  });
});

// update a case by id
app.put('/patients/:id/cases/:caseId', (req, res) => {
  const id = req.params.id;
  const caseId = req.params.caseId;
  const body = req.body || {};

  fs.readFile(PATIENTS_PATH, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read patients' });
    let items = [];
    try {
      items = JSON.parse(data);
    } catch (e) {
      return res.status(500).json({ error: 'Invalid patients data' });
    }

    const pIdx = items.findIndex((p) => p.id === id);
    if (pIdx === -1) return res.status(404).json({ error: 'Patient not found' });
    const cases = items[pIdx].cases || [];
    const cIdx = cases.findIndex((c) => String(c.id) === String(caseId));
    if (cIdx === -1) return res.status(404).json({ error: 'Case not found' });

    const updatedCase = Object.assign({}, cases[cIdx], body);
    items[pIdx].cases[cIdx] = updatedCase;

    fs.writeFile(PATIENTS_PATH, JSON.stringify(items, null, 2), 'utf8', (werr) => {
      if (werr) return res.status(500).json({ error: 'Failed to update case' });
      res.json(updatedCase);
    });
  });
});

// delete a case
app.delete('/patients/:id/cases/:caseId', (req, res) => {
  const id = req.params.id;
  const caseId = req.params.caseId;
  fs.readFile(PATIENTS_PATH, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read patients' });
    let items = [];
    try {
      items = JSON.parse(data);
    } catch (e) {
      return res.status(500).json({ error: 'Invalid patients data' });
    }

    const pIdx = items.findIndex((p) => p.id === id);
    if (pIdx === -1) return res.status(404).json({ error: 'Patient not found' });
    items[pIdx].cases = (items[pIdx].cases || []).filter((c) => String(c.id) !== String(caseId));

    fs.writeFile(PATIENTS_PATH, JSON.stringify(items, null, 2), 'utf8', (werr) => {
      if (werr) return res.status(500).json({ error: 'Failed to delete case' });
      res.json({ ok: true });
    });
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Mock backend running on http://localhost:${PORT}`));
