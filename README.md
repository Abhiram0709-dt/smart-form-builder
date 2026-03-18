# Smart Form Builder & Feedback Collection System

## Overview

This project is a working prototype of a dynamic form platform focused on two outcomes:

1. Making form creation flexible and practical
2. Improving how feedback is captured with a conversational, step-based experience

It supports dynamic form building, shareable form links, response collection, and analytics.

---

## Challenge Goals

The system is designed to satisfy the challenge requirements:

1. Build dynamic forms similar to popular tools
2. Share forms and collect responses
3. Go beyond traditional form filling with innovative feedback collection
4. Store form structure and responses in backend storage
5. Provide retrieval and analytics

---

## What Is Implemented

### 1. Form Builder (Core)

Users can create forms with:

* Title and description
* Question types:

  * Short answer
  * Multiple choice
  * Checkboxes
  * Dropdown
* Question management:

  * Add
  * Edit
  * Delete
  * Reorder (Move Up / Move Down)

---

### 2. Form Filling Experience

* Users can open a shared link and directly access the form
* Chat-style conversational UI
* One-question-at-a-time flow for better focus

---

### 3. Response Collection and Storage

* All responses are stored in MongoDB
* Responses are displayed in:

  * Table view
  * Summary view (counts, selections, text samples)

---

### 4. Innovative Feedback Collection

Implemented differentiators:

* Conversational chat-style form
* One-question-at-a-time step UX
* Voice input for answers (Web Speech API in supported browsers)

---

### 5. Backend System

* Stores form structure
* Stores responses
* Handles retrieval and analytics

---

## Architecture

### Frontend

* React + TypeScript + Vite
* Dynamic form builder UI
* Conversational form filling UI
* Shared-link handling
* Responses dashboard (table + summary)

### Backend

* FastAPI
* MongoDB (Atlas or local)
* REST APIs for forms and responses
* Analytics aggregation APIs

---

## Project Structure

* `frontend/` → React application
* `backend/` → FastAPI application
* `hf-space-backend/` → Hugging Face Space deployment setup

---

## Local Setup

### Prerequisites

* Node.js (v18+ recommended)
* Python (3.10+)
* MongoDB (Atlas URI or local instance)

---

### Backend Setup

```bash
cd backend
```

Create a `.env` file:

```
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB_NAME=smart_form_builder
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the server:

```bash
uvicorn app.main:app --reload
```

👉 The backend will run on a local server (default: http://127.0.0.1:8000)

---

### Frontend Setup

```bash
cd frontend
```

Create a `.env` file:

```
VITE_API_BASE_URL=your_backend_api_url
```

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

👉 The frontend will run on a local development server
👉 Use the URL shown in your terminal (Vite will display it)

---

## Shared Links

After creating a form, the system generates:

* **Fill Link** → Opens form for response submission
* **Responses Link** → Opens analytics/dashboard

You can also use query parameters:

```
?mode=fill&formId=<FORM_ID>
?mode=responses&formId=<FORM_ID>
```

---

## Analytics

Computed per form using stored responses:

* Total responses
* Per-question answered/unanswered counts
* Option counts (MCQ, dropdown, checkbox)
* Text answer samples

---

## API Summary

### Forms

* `POST /forms`
* `GET /forms`
* `GET /forms/{form_id}`
* `GET /forms/{form_id}/analytics`

### Responses

* `POST /responses`
* `GET /responses/{form_id}`

---

## Deployment

### Frontend (Vercel)

```bash
npm run build
```

Set environment variable in Vercel:

```
VITE_API_BASE_URL=your_production_backend_url
```

Then deploy:

```bash
vercel --prod
```

---

### Backend (Hugging Face Spaces)

Set the following environment variables (Secrets):

* `MONGODB_URI`
* `MONGODB_DB_NAME`

Then deploy or restart the Space.

---

## Notes

* Do not commit `.env` files
* Always use environment variables for secrets
* Voice input depends on browser support (Chrome/Edge recommended)

---

## Future Enhancements

* Drag-and-drop question reordering
* Export responses to CSV
* Global analytics across forms
* Role-based access control
