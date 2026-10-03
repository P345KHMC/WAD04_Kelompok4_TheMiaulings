from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import LoginIn, UserOut
from ..security import verify_password, create_token, get_current_user, token_dicabut

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])


@router.post("/login")
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Username atau password salah.")
    return {"access_token": create_token(user), "token_type": "bearer", "user": UserOut.model_validate(user)}


@router.post("/logout")
def logout(user: User = Depends(get_current_user)):
    token_dicabut.add(user.token_jti)
    return {"detail": "Logout berhasil."}


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
