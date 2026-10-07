from fastapi import APIRouter, Depends, HTTPException, status, Security, BackgroundTasks
from fastapi.security.api_key import APIKeyHeader
from sqlalchemy.orm import Session
from app.database.connection import get_db, SessionLocal
from app.models.prediction import Prediction
from app.schemas.predict_schema import PredictionRequest, PredictionResponse
from app.ml_engine.inference import run_ai_inference
import asyncio
import random

API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

# Global simulation state
SIMULATION_RUNNING = False

async def run_simulation_loop():
    global SIMULATION_RUNNING
    import pandas as pd
    import os
    
    csv_path = os.path.join(os.path.dirname(__file__), "../demo_traffic.csv")
    if not os.path.exists(csv_path):
        SIMULATION_RUNNING = False
        return
        
    db = SessionLocal()
    try:
        df = pd.read_csv(csv_path, low_memory=False)
        features_df = df.iloc[:, :-1].apply(pd.to_numeric, errors='coerce').dropna()
        rows = features_df.values.tolist()
        
        while SIMULATION_RUNNING:
            row = random.choice(rows)
            if len(row) == 78:
                row.append(0.0)
            clean_row = [float(x) for x in row]
            
            predicted_class, confidence, mse_loss, is_zero_day = run_ai_inference(clean_row)
            
            new_pred = Prediction(
                source_ip=f"192.168.1.{random.randint(2, 254)}",
                destination_ip=f"10.0.{random.randint(0,5)}.{random.randint(1, 254)}",
                prediction_class=predicted_class,
                confidence_score=confidence,
                is_zero_day=is_zero_day,
                reconstruction_mse=round(mse_loss, 4)
            )
            db.add(new_pred)
            db.commit()
            
            await asyncio.sleep(2.0)
    finally:
        db.close()

router = APIRouter()

@router.post("/simulation/start")
async def start_simulation(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    global SIMULATION_RUNNING
    if SIMULATION_RUNNING:
        return {"status": "already running"}
        
    # Reset database threats so it starts from the beginning
    db.query(Prediction).delete()
    db.commit()
    
    # Reset Federated Learning round counter
    from app.routers import fl_status
    import time
    fl_status.START_TIME = time.time()
    
    SIMULATION_RUNNING = True
    background_tasks.add_task(run_simulation_loop)
    return {"status": "started"}

@router.post("/simulation/stop")
def stop_simulation():
    global SIMULATION_RUNNING
    SIMULATION_RUNNING = False
    return {"status": "stopped"}

# In a real production system, this would check a PostgreSQL database or Redis cache
# For now, we simulate a valid subscribed user API key
VALID_API_KEYS = {"sk_prod_a1b2c3d4e5f6g7h8", "freemium_tier_123"}

def get_api_key(api_key_header: str = Security(api_key_header)):
    if api_key_header in VALID_API_KEYS:
        return api_key_header
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN, detail="Could not validate API KEY"
    )

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

from fastapi import UploadFile, File
import pandas as pd
import io

@router.post("/scan", status_code=status.HTTP_200_OK)
async def bulk_scan_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Enterprise File Upload Scanner.
    Accepts a CSV of network flows, processes them in bulk, and returns a threat report.
    """
    contents = await file.read()
    
    try:
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # We assume the last column is label, so we drop it
        if len(df.columns) > 78:
             features_df = df.iloc[:, :-1]
        else:
             features_df = df
             
        features_df = features_df.apply(pd.to_numeric, errors='coerce').dropna()
        
        total_scanned = 0
        zero_days = 0
        known_threats = 0
        
        # Limit to 500 rows for demo performance
        for index, row in features_df.head(500).iterrows():
            row_list = row.values.tolist()
            if len(row_list) == 78:
                row_list.append(0.0)
                
            clean_row = [float(x) for x in row_list]
            predicted_class, confidence, mse_loss, is_zero_day_flag = run_ai_inference(clean_row)
            
            total_scanned += 1
            if is_zero_day_flag:
                zero_days += 1
            elif predicted_class != "Benign":
                known_threats += 1
                
        return {
            "filename": file.filename,
            "total_scanned": total_scanned,
            "zero_days_detected": zero_days,
            "known_threats_detected": known_threats,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing CSV file: {str(e)}")
