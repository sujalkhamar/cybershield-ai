from pydantic import BaseModel
from typing import List, Dict
from datetime import datetime
from typing import Optional

# What the React Frontend sends to the Backend
class PredictionRequest(BaseModel):
    source_ip: str
    destination_ip: str
    # Expecting an array of 79 numerical features from CICIDS2017
    features: List[float]

# What the Backend sends back to the React Frontend
class PredictionResponse(BaseModel):
    id: int
    source_ip: str
    destination_ip: str
    prediction_class: str
    confidence_score: float
    is_zero_day: bool
    reconstruction_mse: Optional[float] = None
    timestamp: datetime

    class Config:
        from_attributes = True
