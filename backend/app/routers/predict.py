from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.prediction import Prediction
from app.schemas.predict_schema import PredictionRequest, PredictionResponse
import random # Temporary, until we link Twinkle's PyTorch models

router = APIRouter()

@router.post("/predict", response_model=PredictionResponse, status_code=status.HTTP_201_CREATED)
def run_prediction(request: PredictionRequest, db: Session = Depends(get_db)):
    """
    Receives raw network features from the frontend.
    Applies StandardScaler, runs PyTorch LSTM and Autoencoder.
    """
    # ---------------------------------------------------------
    # TODO: Connect to Twinkle's ML Engine Here
    # 1. Scale request.features using StandardScaler
    # 2. prediction_class, confidence = lstm_model.predict(features)
    # 3. mse = autoencoder_model.predict(features)
    # ---------------------------------------------------------

    # MOCK LOGIC (Until Twinkle finishes Module 2)
    classes = ["Benign", "DDoS", "PortScan", "BruteForce", "Botnet"]
    mock_class = random.choice(classes)
    mock_confidence = round(random.uniform(0.70, 0.99), 2)
    
    # Simulate Zero-Day threshold (e.g., if MSE > 10.0)
    mock_mse = round(random.uniform(0.5, 15.0), 2)
    is_zero_day_flag = 1 if mock_mse > 10.0 else 0
    if is_zero_day_flag == 1:
        mock_class = "Zero-Day"

    # Save to SQLite Database
    new_prediction = Prediction(
        source_ip=request.source_ip,
        destination_ip=request.destination_ip,
        prediction_class=mock_class,
        confidence_score=mock_confidence,
        is_zero_day=is_zero_day_flag,
        reconstruction_mse=mock_mse
    )
    
    db.add(new_prediction)
    db.commit()
    db.refresh(new_prediction)
    
    return new_prediction

@router.get("/threats", response_model=list[PredictionResponse])
def get_recent_threats(limit: int = 100, db: Session = Depends(get_db)):
    """
    Returns the latest network predictions for the SOC Dashboard.
    """
    threats = db.query(Prediction).order_by(Prediction.timestamp.desc()).limit(limit).all()
    return threats
