from fastapi import APIRouter, Depends, HTTPException, status, Security
from fastapi.security.api_key import APIKeyHeader
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.prediction import Prediction
from app.schemas.predict_schema import PredictionRequest, PredictionResponse
from app.ml_engine.inference import run_ai_inference

API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

# In a real production system, this would check a PostgreSQL database or Redis cache
# For now, we simulate a valid subscribed user API key
VALID_API_KEYS = {"sk_prod_a1b2c3d4e5f6g7h8", "freemium_tier_123"}

def get_api_key(api_key_header: str = Security(api_key_header)):
    if api_key_header in VALID_API_KEYS:
        return api_key_header
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN, detail="Could not validate API KEY"
    )

router = APIRouter()

@router.post("/predict", response_model=PredictionResponse, status_code=status.HTTP_201_CREATED)
def run_prediction(request: PredictionRequest, db: Session = Depends(get_db), api_key: str = Depends(get_api_key)):
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
