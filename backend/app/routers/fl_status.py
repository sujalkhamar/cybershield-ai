from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class FLStatusResponse(BaseModel):
    status: str
    active_clients: int
    current_round: int
    global_model_version: str

@router.get("/status", response_model=FLStatusResponse)
def get_federated_status():
    """
    Returns the real-time status of the Federated Learning cluster.
    The React dashboard will poll this to show the network map.
    """
    # In a real production app, we would query the Flower server's internal state.
    # For now, we mock the response to feed the SOC Dashboard.
    return {
        "status": "Federation Active (Waiting for clients...)",
        "active_clients": 0,
        "current_round": 1,
        "global_model_version": "v1.0.0-base"
    }
