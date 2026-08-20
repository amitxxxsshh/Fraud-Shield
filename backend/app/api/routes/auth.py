from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token, get_current_user_optional
from app.models.entities import User
from app.schemas.auth import UserRegister, UserLogin, TokenResponse, UserResponse
from app.services.privacy_service import PrivacyService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
def register_user(req: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == req.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username is already registered")

    phone_h = PrivacyService.hash_identifier(req.phone) if req.phone else None
    upi_h = PrivacyService.hash_identifier(req.upi_handle) if req.upi_handle else None

    user = User(
        username=req.username,
        hashed_password=get_password_hash(req.password),
        role=req.role or "USER",
        phone_hash=phone_h,
        upi_handle_hash=upi_h,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.username, extra_claims={"role": user.role, "user_id": user.id})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        username=user.username,
        role=user.role,
        user_id=user.id,
    )


@router.post("/login", response_model=TokenResponse)
def login_user(req: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(subject=user.username, extra_claims={"role": user.role, "user_id": user.id})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        username=user.username,
        role=user.role,
        user_id=user.id,
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(user: User = Depends(get_current_user_optional)):
    if not user:
        # Return default demo guest profile
        return UserResponse(
            id="demo-user-1",
            username="demouser",
            role="USER",
            phone_hash=PrivacyService.hash_identifier("9876543210"),
            upi_handle_hash=PrivacyService.hash_identifier("rahul@okaxis"),
        )
    return UserResponse(
        id=user.id,
        username=user.username,
        role=user.role,
        phone_hash=user.phone_hash,
        upi_handle_hash=user.upi_handle_hash,
    )
