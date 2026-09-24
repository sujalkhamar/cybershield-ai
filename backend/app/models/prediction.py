from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database.connection import Base

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    source_ip = Column(String, index=True)
    destination_ip = Column(String)
    prediction_class = Column(String, default="Benign") # Benign, DDoS, PortScan, BruteForce, Botnet, Zero-Day
    confidence_score = Column(Float)
    is_zero_day = Column(Integer, default=0) # 0 for No, 1 for Yes
    reconstruction_mse = Column(Float, nullable=True) # Used by Autoencoder
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
