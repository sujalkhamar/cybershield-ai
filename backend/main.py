from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, predict

app = FastAPI(title="CyberShield-AI API", version="1.0.0")

# Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev, update in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(predict.router, prefix="/api/v1", tags=["Prediction Engine"])
# app.include_router(fl_status.router, prefix="/api/v1/fl", tags=["Federated Learning"])

@app.get("/")
def root():
    return {"status": "CyberShield-AI Backend is Active"}
