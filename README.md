# XAI‑Sec v2.0 🚀

> **Explainable AI Security Platform** – a lightweight demo that blends an **explainable IDS** and **malware‑analysis** pipeline with a modern **FastAPI** backend and a snappy **Next.js** frontend.

---

## 🎯 What’s This?
XAI‑Sec is a *playground* for anyone curious about how **explainable AI** can make security tools more transparent:
- **Intrusion Detection System (IDS)** – small model that tells you whether traffic looks malicious **and** why.
- **Malware Classification** – tiny model that predicts the malware family and highlights the key features it used.

The backend (Python + FastAPI) serves the predictions, while the frontend (React‑powered Next.js) gives you a clean UI to play with.

> **Heads‑up:** The repo ships with an *offline fallback* – the UI works even if the backend isn’t running (perfect for GitHub Pages demos).

---

## ✨ Key Features
- **Explainable predictions** – SHAP/LIME visualisations for every scan.
- **Dashboard** – glance at recent scans, stats, and visual insights.
- **CORS‑locked** – only localhost and GitHub‑Pages are allowed, keeping things safe.
- **One‑click launch** – hit `start.bat` and both servers spin up.
- **Static export** – host the UI on GitHub Pages in demo mode.
- **Easy to extend** – clear split between API and UI makes tinkering simple.

---

## 🏗️ Architecture (at a glance)
```
XAI‑Sec
│
├─ backend/               # FastAPI server (prediction APIs)
│   ├─ main.py            # entry point, CORS config
│   └─ models/            # IDS & Malware models + SHAP utils
│
├─ frontend/              # Next.js app
│   ├─ app/
│   │   ├─ lib/api.js     # smart API client with fallback data
│   │   └─ page.js        # landing page & navigation logic
│   └─ next.config.mjs    # static export setup
│
├─ start.bat               # launches both backend & frontend in separate terminals
├─ .github/workflows/      # GitHub Actions for static site build
└─ README.md               # you are reading it!
```

---

## ⚙️ Prerequisites
- **Windows** (PowerShell) – the repo is set up for Windows line endings.
- **Python 3.10+** (use a virtual environment).
- **Node.js 18+** and `npm` (or `pnpm`).
- **Git** – for version control.

---

## 📦 Installation & Setup
```powershell
# 1️⃣ Clone the repo (if you haven’t already)
git clone https://github.com/PrashXploit/xai.git
cd xai

# 2️⃣ Create a Python venv and install backend deps
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

# 3️⃣ Install the frontend packages
cd frontend
npm install   # or pnpm install
cd ..
```
> `requirements.txt` already pulls in FastAPI, uvicorn, and the tiny ML libs we need.

---

## 🚀 Running the App
The quickest way is the bundled launcher:
```powershell
# From the project root
start.bat
```
Two terminals pop up:
1. **FastAPI** – <http://localhost:8000> (Swagger UI at <http://localhost:8000/docs>)
2. **Next.js** – <http://localhost:3000>

If you like doing things manually, here’s how:
```powershell
# Backend (auto‑reload on changes)
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

# Frontend – open a *second* terminal
cd frontend
npm run dev   # 👉 http://localhost:3000
```

---

## 📚 API Docs
FastAPI auto‑generates OpenAPI docs. Once the backend is up, head over to <http://localhost:8000/docs>.

**Quick glance at the endpoints**:
- `POST /ids/predict` – returns a label **and** SHAP values.
- `POST /malware/predict` – returns a label **and** LIME explanations.
- `GET /history` – pulls previous scan results (the UI stores them in `localStorage`).

---

## 🛠️ Development Tips
### Backend
- All code lives under `backend/`.
- Add new routes in `backend/main.py`.
- The `--reload` flag means you see changes instantly.

### Frontend
- UI bits are under `frontend/app/`.
- The API client (`frontend/app/lib/api.js`) automatically switches between a real backend and the offline demo data.
- Run `npm run lint` (or `npm run format` if you set it up) before committing.

---

## ✅ Testing
A couple of quick sanity‑check scripts are included:
```powershell
# IDS sanity check
python - <<EOF
from backend.models.ids import predict
print(predict([0.1, 0.2, 0.3]))
EOF

# Malware sanity check
python - <<EOF
from backend.models.malware import predict
print(predict([0.5, 0.3, 0.2]))
EOF
```
For proper unit tests, add files under `backend/tests/` and run them with `pytest`.

---

## 🌐 Deployment Options
### GitHub Pages (static UI)
Our GitHub Action (`.github/workflows/static.yml`) runs `next export` and pushes the generated `out/` folder to the `gh-pages` branch. The UI works in **demo mode** because the FastAPI backend can’t run on GitHub Pages – it simply falls back to the canned demo data.

### Hosting the FastAPI Backend
You’ll need a real server (Render, Fly.io, Google Cloud Run, etc.). When you deploy, remember to add the new domain to the CORS whitelist in `backend/main.py`.

---

## 🤝 Contributing
1. Fork the repo.
2. Create a feature branch (`git checkout -b feat/your‑feature`).
3. Make your changes and write clear commit messages.
4. Open a Pull Request.

Please keep the existing code style, run the linter, and add tests where appropriate.

---

## 📄 License
This project is released under the **MIT License** – see the `LICENSE` file for the full text.

---

## 🙏 Acknowledgements
- **FastAPI** – for the lightning‑fast async API.
- **Next.js** – for the modern React UI.
- **SHAP** & **LIME** – for the explainability magic.
- **OpenAI** – for design guidance and the helpful assistant.

---

*Happy hacking and enjoy exploring explainable security!*
