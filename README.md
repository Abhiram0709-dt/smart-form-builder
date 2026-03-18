# Smart Form Builder & Feedback Collection System

## Overview
This project is a working prototype of a dynamic form platform focused on two outcomes:

1. Making form creation flexible and practical.
2. Improving how feedback is captured with a conversational, step-based experience.

It supports dynamic form building, shareable form links, response collection, and analytics.

## Challenge Goals
The system is designed to satisfy the challenge requirements:

1. Build dynamic forms similar to popular tools.
2. Share forms and collect responses.
3. Go beyond traditional form filling with innovative feedback collection.
4. Store form structure and responses in backend storage.
5. Provide retrieval and analytics.

## What Is Implemented

### 1. Form Builder (Core)
Users can create forms with:

1. Title and description.
2. Question types:
   - Short answer
   - Multiple choice
   - Checkboxes
   - Dropdown
3. Question management:
   - Add
   - Edit
   - Delete
   - Reorder (Move Up / Move Down)

### 2. Form Filling Experience
1. Users can open a shared link and land directly in fill mode.
2. Form filling is clean and simple in a chat-style UI.
3. One-question-at-a-time flow improves completion focus.

### 3. Response Collection and Storage
1. All responses are stored in MongoDB.
2. Responses are shown in a structured dashboard:
   - Table view
   - Summary view (counts, selections, text samples)

### 4. Innovative Feedback Collection
Implemented differentiators:

1. Conversational chat-style form.
2. One-question-at-a-time step UX.
3. Voice input for answers (Web Speech API in supported browsers).

### 5. Backend System
1. Stores form structure.
2. Stores responses.
3. Handles retrieval and analytics.

## Architecture

### Frontend
- React + TypeScript + Vite
- Dynamic builder UI
- Conversational filler UI
- Shared-link handling
- Responses dashboard (table + summary)

### Backend
- FastAPI
- MongoDB (Atlas/local)
- Form and response APIs
- Analytics aggregation APIs

## Project Structure
- `frontend/` : React application
- `backend/` : FastAPI application
- `hf-space-backend/` : Hugging Face Space deployment repository clone

## Local Setup

## Prerequisites
1. Node.js 20+
2. Python 3.10+
3. MongoDB connection (Atlas URI or local MongoDB)

### Backend
1. Go to backend folder:
   - `cd backend`
2. Create local env file (or copy from `.env.example`):
   - `MONGODB_URI=...`
   - `MONGODB_DB_NAME=smart_form_builder`
   - `JWT_SECRET_KEY=...`
   - `JWT_ALGORITHM=HS256`
   - `JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440`
3. Install dependencies:
   - `pip install -r requirements.txt`
4. Run server:
   - `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

### Frontend
1. Go to frontend folder:
   - `cd frontend`
2. Create env file:
   - `VITE_API_BASE_URL=http://127.0.0.1:8000`
3. Install dependencies:
   - `npm install`
4. Run app:
   - `npm run dev`

## Shared Links
After saving a form in builder mode, the app provides:

1. Fill Link: opens the form directly for response submission.
2. Responses Link: opens the response dashboard for that form.

The app also supports opening these links directly with query params:

- `?mode=fill&formId=<FORM_ID>`
- `?mode=responses&formId=<FORM_ID>`

## Analytics
Analytics are computed per form from stored responses.

Returned metrics include:

1. Total responses.
2. Per-question answered and unanswered counts.
3. Option counts for MCQ, dropdown, and checkbox questions.
4. Text answer samples for short-answer questions.

## API Summary

### Auth
- `POST /auth/signup`
- `POST /auth/login`

### Forms
- `POST /forms`
- `GET /forms`
- `GET /forms/{form_id}`
- `GET /forms/{form_id}/analytics`

### Responses
- `POST /responses`
- `GET /responses/{form_id}`

## Deployment

### Frontend (Vercel)
From `frontend/`:

1. `npm run build`
2. `vercel env add VITE_API_BASE_URL production`
3. `vercel --prod`

### Backend (Hugging Face Spaces)
Use `hf-space-backend/` and set Space Secrets:

1. `MONGODB_URI`
2. `MONGODB_DB_NAME`
3. `JWT_SECRET_KEY`
4. `JWT_ALGORITHM`
5. `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`

Then push/restart the Space.

## Notes
1. Do not commit local `.env` files.
2. Keep credentials in deployment secrets.
3. Voice input depends on browser support (Chrome/Edge recommended).

## Future Enhancements
1. Drag-and-drop reordering in builder.
2. Export responses to CSV.
3. Global analytics overview across forms.
4. Optional role-based access controls for teams.
