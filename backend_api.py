
import os
from datetime import datetime, timedelta
from typing import List, Optional

import requests
import uvicorn
from fastapi import Depends, FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from jose import JWTError, jwt
import re
import secrets
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, validator
from fastapi.responses import JSONResponse
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker, relationship
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

try:
    from backend.ai import ai_service
except ImportError:
    # Handle if folder structure differs
    from ai import ai_service

# Database Setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./mizan.db")
# Fix for Railway internal Postgres URLs which might start with postgres:// instead of postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Security Setup
SECRET_KEY = os.getenv("JWT_SECRET", "mizan_secret_key_change_in_production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 1 week

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Rate Limiting
limiter = Limiter(key_func=get_remote_address)

# Models
class UserDB(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_verified = Column(Integer, default=0) # 0: false, 1: true
    verification_token = Column(String, nullable=True)
    reset_token = Column(String, nullable=True)
    failed_login_attempts = Column(Integer, default=0)
    lockout_until = Column(DateTime, nullable=True)
    transactions = relationship("TransactionDB", back_populates="owner")
    categories = relationship("CategoryDB", back_populates="owner")

class CategoryDB(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    type = Column(String) # 'income' | 'expense'
    user_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("UserDB", back_populates="categories")

class TransactionDB(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    amount = Column(Float)
    category = Column(String)
    type = Column(String) # 'income' | 'expense'
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("UserDB", back_populates="transactions")

# Pydantic Schemas
class TransactionBase(BaseModel):
    title: str
    amount: float
    category: str
    type: str

class TransactionCreate(TransactionBase):
    pass

class Transaction(TransactionBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        orm_mode = True # For Pydantic v1
        from_attributes = True # For Pydantic v2

class UserBase(BaseModel):
    email: str
    name: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_verified: int # 0 or 1

    class Config:
        orm_mode = True
        from_attributes = True

class CategoryBase(BaseModel):
    name: str
    type: str

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True
        from_attributes = True

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

class PasswordResetRequest(BaseModel):
    email: str

class PasswordReset(BaseModel):
    token: str
    new_password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

# Utils
import secrets

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_password_hash(password):
    # Safety check: Argon2 (via passlib) handles long passwords fine, 
    # but we validate length explicitly to prevent any potential issues.
    if len(password) > 128:
        raise ValueError("Password is too long.")
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def validate_password_strength(password: str):
    """
    Enforces fintech-level password security.
    """
    if len(password) < 8:
        return "Password must be at least 8 characters long."
    if len(password) > 128:
        return "Password is too long."
    if not re.search(r"[A-Z]", password):
        return "Password must contain at least one uppercase letter."
    if not re.search(r"[a-z]", password):
        return "Password must contain at least one lowercase letter."
    if not re.search(r"\d", password):
        return "Password must contain at least one number."
    if not re.search(r"[@$!%*?&]", password):
        return "Password must contain at least one special character (@$!%*?&)."
    return None

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def generate_token():
    return secrets.token_urlsafe(32)

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(UserDB).filter(UserDB.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# API
app = FastAPI(title="Mizan API")
app.state.limiter = limiter
# Global Exception Handler for Standardized JSON Errors
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": str(exc.detail)
        }
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    print(f"Unhandled Exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error. Please try again later."
        }
    )

allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    print(f"Registration attempt for: {user.email}")
    db_user = db.query(UserDB).filter(UserDB.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Password Policy Validation
    error_message = validate_password_strength(user.password)
    if error_message:
        raise HTTPException(status_code=400, detail=error_message)
    
    try:
        hashed_password = get_password_hash(user.password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    verification_token = generate_token()
    new_user = UserDB(
        email=user.email, 
        name=user.name, 
        hashed_password=hashed_password,
        verification_token=verification_token,
        is_verified=0
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Log the verification link (simulating email send)
    # In a real fintech app, use AWS SES / SendGrid
    print(f"VERIFICATION LINK for {new_user.email}: http://localhost:3000/verify/{verification_token}")
    
    return {
        "success": True,
        "message": "Account created. Please verify your email before logging in.",
        "user_id": new_user.id
    }

@app.get("/verify-email/{token}")
def verify_email(token: str, db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.verification_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    user.is_verified = 1
    user.verification_token = None
    db.commit()
    return {"detail": "Email verified successfully"}

@app.post("/login", response_model=Token)
@limiter.limit("5/minute")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.email == form_data.username).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check for account lockout
    if user.lockout_until and user.lockout_until > datetime.utcnow():
        wait_minutes = int((user.lockout_until - datetime.utcnow()).total_seconds() / 60) + 1
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail=f"Account locked due to multiple failed attempts. Please try again in {wait_minutes} minutes."
        )

    if not verify_password(form_data.password, user.hashed_password):
        # Handle failed attempt
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= 5:
            user.lockout_until = datetime.utcnow() + timedelta(minutes=15)
            user.failed_login_attempts = 0 # Reset for next cycle
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Too many failed attempts. Account has been locked for 15 minutes."
            )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email address before logging in."
        )
    
    # Successful login: Reset failed attempts and lockout
    user.failed_login_attempts = 0
    user.lockout_until = None
    db.commit()
        
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@app.get("/transactions", response_model=List[Transaction])
def get_transactions(current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(TransactionDB).filter(TransactionDB.user_id == current_user.id).order_by(TransactionDB.created_at.desc()).all()

@app.post("/transactions", response_model=Transaction)
def create_transaction(transaction: TransactionCreate, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    db_item = TransactionDB(**transaction.dict(), user_id=current_user.id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.delete("/transactions/{transaction_id}")
def delete_transaction(transaction_id: int, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    db_item = db.query(TransactionDB).filter(TransactionDB.id == transaction_id, TransactionDB.user_id == current_user.id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(db_item)
    db.commit()
    return {"detail": "Deleted"}

# Category Endpoints
@app.get("/categories", response_model=List[Category])
def get_categories(current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(CategoryDB).filter(CategoryDB.user_id == current_user.id).all()

@app.post("/categories", response_model=Category)
def create_category(category: CategoryCreate, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    db_item = CategoryDB(**category.dict(), user_id=current_user.id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.delete("/categories/{category_id}")
def delete_category(category_id: int, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    db_item = db.query(CategoryDB).filter(CategoryDB.id == category_id, CategoryDB.user_id == current_user.id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(db_item)
    db.commit()
    return {"detail": "Deleted"}

# Security Endpoints
@app.post("/change-password")
def change_password(data: PasswordChange, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"detail": "Password updated"}

@app.post("/forgot-password")
def forgot_password(data: PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.email == data.email).first()
    if user:
        token = generate_token()
        user.reset_token = token
        db.commit()
        print(f"RESET LINK for {user.email}: http://localhost:3000/reset-password/{token}")
    
    return {"detail": "If email exists, a reset link has been sent"}

@app.post("/reset-password")
def reset_password(data: PasswordReset, db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.reset_token == data.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    user.hashed_password = get_password_hash(data.new_password)
    user.reset_token = None
    db.commit()
    return {"detail": "Password reset successful"}

# AI Service Integration
OLLAMA_URL = "http://192.168.1.2:11434/api/generate"
MODEL_NAME = "glm4:9b"

@app.post("/analyze")
async def analyze_finances(transactions: List[TransactionBase], lang: str = "ar", current_user: UserDB = Depends(get_current_user)):
    summary = "\n".join([f"- {t.type}: {t.title} ({t.amount} SAR) category: {t.category}" for t in transactions])
    
    analysis = ai_service.analyze_finances(summary, lang=lang)
    return analysis

# Serve Frontend Static Files
# This should be at the end to avoid intercepting API routes
try:
    app.mount("/", StaticFiles(directory="dist", html=True), name="static")
except Exception:
    # Directory might not exist yet during initial dev
    pass

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
