# Mock Backend for Therapy App

This folder contains a tiny mock backend exposing a list of example exercises.

Run locally:

```bash
cd Backend
npm install
npm start
```

Endpoints:
- `GET /exercises` — returns the full list from `exercises.json`
- `GET /exercises/search?q=term` — returns exercises matching `term` in name or description
 - `POST /exercises` — append a new exercise (JSON body: `{ name, category?, description? }`) and return the created exercise
