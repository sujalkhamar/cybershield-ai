from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.user import User
from app.schemas.user_schema import UserCreate, UserResponse, UserLogin, Token
import hashlib

router = APIRouter()

# Very basic hashing for the SGP demonstration 
# (In real production, use Passlib + bcrypt)
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter((User.email == user.email) | (User.username == user.username)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or Email already registered")
    
    # Create new user
    hashed_pw = hash_password(user.password)
    new_user = User(
        username=user.username, 
        email=user.email, 
        hashed_password=hashed_pw,
        role="analyst"
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    # Verify user
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Verify password
    if db_user.hashed_password != hash_password(user.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # For the SGP demo, we return a mock JWT token. 
    # (Next step is replacing this with pyjwt)
    mock_token = f"jwt_token_for_{db_user.username}_12345"
    
    return {"access_token": mock_token, "token_type": "bearer"}
