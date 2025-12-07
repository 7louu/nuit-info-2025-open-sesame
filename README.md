# nuit-info-2025-open-sesame
This project was part of the Nuit d'info 2025 challenge "Sésame ouvre toi"

# 🚪 Open Sesame

> Voice-powered authentication system with a magical touch.

Open Sesame combines **Speaker Verification** with **Keyword Detection** to create a Two-Factor Authentication experience using only your voice.

## ✨ Features

- **🗣️ Voice Biometrics**: Verifies *who* is speaking using SpeechBrain's ECAPA-TDNN model.
- **🔑 Keyword Detection**: Verifies *what* is being said (e.g., "Open Sesame").
- **🚪 Magic Door UI**: A stunning 3D interactive interface with mystical animations.
- **🛡️ Privacy-Focused**: Audio processing happens securely; embeddings are stored locally.

## 🛠️ Tech Stack

- **Backend**: FastAPI, SpeechBrain, Librosa, PyTorch
- **Frontend**: React, Vite
- **Deployment**: Docker, Docker Compose

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local frontend dev)
- Python 3.9+ (for local backend dev)

### Quick Start (Docker)
1. Build and run the stack:
   ```bash
   docker-compose up --build
   ```
2. Access the app at http://localhost:5173

### Quick Start (Local Development)
#### Backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate #or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```
API running at http://localhost:8000

#### Frontend:
```bash
cd frontend-widget
npm install
npm run dev
```
APP running at http://localhost:5173

## 📚 API Documentation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Register a new user with 3 voice samples |
| POST | `/api/authenticate` | Verify speaker identity and passphrase |

## 🧪 Testing

Run live integration tests:
```bash
cd backend
python tests/test_live_flow.py
```
