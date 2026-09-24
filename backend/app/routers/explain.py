from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from app.ml_engine.shap_explainer import generate_shap_explanation

router = APIRouter()

class ExplainRequest(BaseModel):
    prediction_class: str
    features: List[float]

class FeatureImportance(BaseModel):
    feature: str
    importance: float

class ExplainResponse(BaseModel):
    prediction_class: str
    top_features: List[FeatureImportance]

# Map string classes to their model output index
CLASS_MAP = {
    "Benign": 0,
    "DDoS": 1,
    "PortScan": 2,
    "BruteForce": 3,
    "Botnet": 4,
    "Zero-Day": 0 # Zero day is handled by autoencoder, SHAP explains standard attacks
}

@router.post("/explain", response_model=ExplainResponse)
def explain_prediction(request: ExplainRequest):
    """
    Takes an attack's features and uses SHAP to explain WHY the AI made that decision.
    """
    if len(request.features) != 79:
        raise HTTPException(status_code=400, detail="Must provide exactly 79 CICIDS features")
        
    class_idx = CLASS_MAP.get(request.prediction_class, 0)
    
    # Run SHAP
    top_features = generate_shap_explanation(request.features, class_idx)
    
    return {
        "prediction_class": request.prediction_class,
        "top_features": top_features
    }
