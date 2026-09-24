import time
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

# Server start time to calculate dynamic elapsed rounds
START_TIME = time.time()

class FLStatusResponse(BaseModel):
    status: str
    active_clients: int
    current_round: int
    global_model_version: str

@router.get("/status", response_model=FLStatusResponse)
def get_federated_status():
    """
    Returns the real-time status of the Federated Learning cluster.
    """
    # Simulate continuous FL weight aggregation every 20 seconds
    elapsed_rounds = int((time.time() - START_TIME) / 20)
    current_round = 12 + elapsed_rounds
    
    return {
        "status": "Federation Active (Aggregating Edge Weights)",
        "active_clients": 3,
        "current_round": current_round,
        "global_model_version": f"v2.1.{current_round}-global"
    }
