<div align="center">
  <img src="https://img.icons8.com/color/96/000000/shield.png" alt="CyberShield-AI Logo"/>
  <h1>CyberShield-AI 🛡️</h1>
  <p><strong>An Explainable Federated Learning Framework for Real-Time Zero-Day Cyberattack Prediction</strong></p>

  [![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python&logoColor=white)](https://python.org)
  [![PyTorch](https://img.shields.io/badge/PyTorch-2.0%2B-ee4c2c?logo=pytorch&logoColor=white)](https://pytorch.org)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.103-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
  [![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=black)](https://reactjs.org)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
  [![Flower](https://img.shields.io/badge/Federated_Learning-Flower-F4C94F?logo=linux&logoColor=black)](https://flower.dev/)
</div>

---

## 📖 Overview

**CyberShield-AI** is a privacy-preserving, transparent cybersecurity framework designed to intercept and interpret sophisticated network threats in real-time. Traditional Intrusion Detection Systems (IDS) rely on static signatures, failing against novel (zero-day) exploits. Centralized Deep Learning models solve this but violate stringent data privacy laws (e.g., GDPR) by pooling raw packet captures.

CyberShield-AI introduces a **4-Tier Decoupled Architecture**:
1. **Dual-Stage Deep Learning:** PyTorch Long Short-Term Memory (LSTM) networks for signature-based threat classification, and a Deep Autoencoder for zero-day anomaly detection (based on Reconstruction Loss $MSE > \tau$).
2. **Federated Learning (FL):** Built on the Flower (`flwr`) framework, enabling decentralized, collaborative model training without raw telemetry leakage.
3. **Explainable AI (XAI):** Real-time **SHAP** (SHapley Additive exPlanations) integration to eliminate the "black-box" problem, providing SOC analysts with mathematical attributions for every predicted threat.
4. **Live SOC Dashboard:** A React/Tailwind frontend for real-time visualization of network streams, model convergence, and threat intelligence.

---

## 🛠️ Core Tech Stack

| Category | Technology |
| :--- | :--- |
| **Frontend UI** | React.js (Vite), Tailwind CSS, Recharts, Lucide-React |
| **Backend API** | Python, FastAPI, Uvicorn, SQLite |
| **Machine Learning** | PyTorch, Scikit-Learn, Pandas, NumPy |
| **Federated Learning** | Flower (`flwr`) |
| **Explainability (XAI)** | SHAP (`shap`) |

---

## 📁 Repository Structure & Modules

```text
CyberShield-AI/
├── backend/                  # FastAPI Application & SQLite Database
│   ├── app/                  # Routers, Schemas, ML Inference Engine
│   └── simulate_traffic.py   # Live Telemetry Injector
├── frontend/                 # React.js SOC Dashboard
├── datasets/                 # Local CICIDS2017 Dataset (Ignored in Git)
├── train_models.py           # Core Model Training Script
├── module_1_data_prep.py     # Data Cleaning & Z-Score Normalization
├── module_2_ai_models.py     # PyTorch Architectures & Live Simulation
├── module_3_xai.py           # DeepExplainer SHAP Analysis
└── module_4_comparing.py     # Performance Benchmark Visualizations
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10+
- Node.js 18+

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/CyberShield-AI.git
cd CyberShield-AI

# Install Backend & ML Dependencies
pip install -r backend/requirements.txt

# Install Frontend Dependencies
cd frontend
npm install
cd ..
```
*(Ensure your `CICIDS.csv` dataset is placed in the project directory before running training).*

---

## 💻 How to Run the Project

### Phase 1: Model Training
Train the LSTM and Autoencoder models natively on your dataset:
```bash
python train_models.py
```

### Phase 2: Start the Backend (Terminal 1)
Launch the FastAPI inference engine:
```bash
cd backend
uvicorn main:app --reload --port 8000
```

### Phase 3: Start the Frontend SOC Dashboard (Terminal 2)
Launch the React interface:
```bash
cd frontend
npm run dev
```

### Phase 4: Inject Live Traffic (Terminal 3)
Stream live network telemetry from the dataset into the backend:
```bash
cd backend
python simulate_traffic.py
```
*Your React Dashboard will now light up with real-time analytics, reconstruction loss charting, and threat logs!*

---

## 📊 Running Academic Modules (Review Demos)
To individually evaluate the core logic used in our research, you can run the standalone modules:
- **Module 1 (Data Prep):** `python module_1_data_prep.py`
- **Module 2 (Model Sim):** `python module_2_ai_models.py`
- **Module 3 (XAI Visuals):** `python module_3_xai.py`
- **Module 4 (Benchmarks):** `python module_4_comparing.py`

---

## 👨‍💻 Research & Authors
- **Sujal Khamar** - *Department of Computer Science & Engineering, Indus University*
- **Twinkle Kanparia** - *Department of Computer Science & Engineering, Indus University*
- **Prof. Dhivya Vijayakannan** - *Project Guide*

*Developed as part of an IEEE-format research initiative on Privacy-Preserving Intrusion Detection Systems.*
