from pydantic import BaseModel, EmailStr
from typing import Optional

# Schema for User Registration (Input)
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

# Schema for User Login (Input)
class UserLogin(BaseModel):
    username: str
    password: str

# Schema for User Response (Output - hides password)
class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True

# Schema for JWT Token Response
class Token(BaseModel):
    access_token: str
    token_type: str
