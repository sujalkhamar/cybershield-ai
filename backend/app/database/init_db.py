from app.database.connection import engine, Base
from app.models.user import User
from app.models.prediction import Prediction
# We will import other models here as we create them (e.g., ThreatLog)

def init_db():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    init_db()
