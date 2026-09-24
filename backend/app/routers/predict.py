from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.prediction import Prediction
from app.schemas.predict_schema import PredictionRequest, PredictionResponse
from app.ml_engine.inference import run_ai_inference

router = APIRouter()

@router.post("/predict", response_model=PredictionResponse, status_code=status.HTTP_201_CREATED)
def run_prediction(request: PredictionRequest, db: Session = Depends(get_db)):
    """
    Receives raw network features from the frontend.
    Applies inference via PyTorch LSTM and Autoencoder.
    """
    
    # Run the actual PyTorch Models
    predicted_class, confidence, mse_loss, is_zero_day_flag = run_ai_inference(request.features)

    # Save to SQLite Database
    new_prediction = Prediction(
        source_ip=request.source_ip,
        destination_ip=request.destination_ip,
        prediction_class=predicted_class,
        confidence_score=confidence,
        is_zero_day=is_zero_day_flag,
        reconstruction_mse=round(mse_loss, 4)
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
