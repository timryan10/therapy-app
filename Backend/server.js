const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_PATH = path.join(__dirname, 'exercises.json');
const PATIENTS_PATH = path.join(__dirname, 'patients.json');

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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Mock backend running on http://localhost:${PORT}`));
