import hashlib, hmac, os, uuid
from datetime import datetime, timedelta, timezone
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from .database import get_db
from .models import User

SECRET_KEY = os.getenv("SECRET_KEY", "ganti-secret-ini-di-produksi")
bearer = HTTPBearer(auto_error=False)
token_dicabut = set()  # jti token yang sudah logout (di memori; hilang jika server restart)


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    hasil = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100_000)
    return salt.hex() + "$" + hasil.hex()


def verify_password(password: str, tersimpan: str) -> bool:
    salt, hasil = tersimpan.split("$")
    cek = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), 100_000)
    return hmac.compare_digest(cek.hex(), hasil)


def create_token(user: User) -> str:
    payload = {"sub": str(user.id), "role": user.role, "jti": uuid.uuid4().hex,
               "exp": datetime.now(timezone.utc) + timedelta(hours=8)}
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def get_current_user(cred=Depends(bearer), db: Session = Depends(get_db)) -> User:
    tidak_valid = HTTPException(401, "Token tidak valid atau sudah kedaluwarsa. Silakan login lagi.")
    if not cred:
        raise tidak_valid
    try:
        payload = jwt.decode(cred.credentials, SECRET_KEY, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise tidak_valid
    if payload["jti"] in token_dicabut:
        raise tidak_valid
    user = db.get(User, int(payload["sub"]))
    if not user:
        raise tidak_valid
    user.token_jti = payload["jti"]
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(403, "Fitur ini hanya untuk admin.")
    return user
