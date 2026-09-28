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
 - `GET /therapists/:id/favorites` — returns an array of favorite exercises for the therapist
 - `POST /therapists/:id/favorites` — add a new favorite for the therapist (body: exercise object)
 - `DELETE /therapists/:id/favorites/:exerciseId` — remove a favorite by id
 - `POST /patients` — create a new patient. Body: `{ firstName, lastName, contact?, birthdate?, notes? }`. Returns created patient with `id`.
 - `PUT /patients/:id` — update an existing patient. Body may include `{ firstName?, lastName?, contact?, birthdate?, lastVisit?, notes? }`.
