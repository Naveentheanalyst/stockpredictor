# 📈 AI Stock Predictor (Python + Static Deployment)

This repository contains a two-part architecture:
1. **Frontend**: A static HTML/CSS/JS user interface that can be deployed directly to GitHub Pages.
2. **Backend API**: A Python Flask server that trains the GRU Deep Learning model and returns predictions.

## 🌟 Architecture Explained

GitHub Pages **only** hosts static files (HTML, CSS, JS, Images). It cannot run Python code, TensorFlow (Python version), or Streamlit.
Therefore, to use a Python model dynamically while deploying the UI to GitHub Pages, the project is split.

- `frontend/`: Contains the UI. Deploy this folder to GitHub Pages.
- `backend/`: Contains the Python code. Deploy this to a free cloud provider like Render, Heroku, or PythonAnywhere.

## 🚀 1. Deploying the Frontend (GitHub Pages)

1. Push this code to a GitHub repository.
2. Go to repository **Settings** -> **Pages**.
3. Set the source to your `main` branch, but specify the `/frontend` directory (or move the frontend files to the root of your repo before pushing).
4. Save. Your beautiful UI will be live!

*Note: Before deploying, update `script.js` line 11 `const BACKEND_URL = ...` to point to your deployed Python API instead of localhost.*

## 🐍 2. Running the Python Backend (Locally or Deployed)

### Locally
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the Flask Server:
   ```bash
   python app.py
   ```
   The backend API will run on `http://localhost:5001`.

### Deploying the Backend
To make the app work for anyone on the internet, you must host the backend API.
- **Render.com**: Create a "Web Service", connect your GitHub repo, set the root directory to `backend`, start command to `gunicorn app:app`, and it will host it for free.
- **Heroku**: Similar process using a Procfile.

## 🛠 Tech Stack
- **Frontend**: HTML5, Vanilla CSS (Glassmorphism), Chart.js
- **Backend**: Python, Flask, Flask-CORS
- **Machine Learning**: TensorFlow (Keras GRU), Scikit-learn
- **Data Source**: yfinance
