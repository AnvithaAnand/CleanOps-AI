from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user, require_role
from app.database import get_db
from app.models.user import User
from app.services.auth_service import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


class SignupRequest(BaseModel):
    email: str
    password: str
    full_name: str


class LoginRequest(BaseModel):
    email: str
    password: str


class RoleUpdate(BaseModel):
    role: str


def _user_dict(u: User) -> dict:
    return {
        "id": u.id,
        "email": u.email,
        "full_name": u.full_name,
        "role": u.role,
        "is_active": u.is_active,
        "created_at": u.created_at.isoformat(),
    }


@router.post("/signup", status_code=201)
async def signup(body: SignupRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email.lower()))
    if result.scalar_one_or_none():
        raise HTTPException(400, "Email already registered")

    # First user becomes admin
    result = await db.execute(select(User).limit(1))
    is_first = result.scalar_one_or_none() is None

    user = User(
        email=body.email.lower(),
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
        role="admin" if is_first else "analyst",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(user.id, user.email, user.role)
    return {"access_token": token, "token_type": "bearer", "user": _user_dict(user)}


@router.post("/login")
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email.lower()))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(400, "Account is disabled")

    token = create_access_token(user.id, user.email, user.role)
    return {"access_token": token, "token_type": "bearer", "user": _user_dict(user)}


@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    return _user_dict(current_user)


@router.get("/users")
async def list_users(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    result = await db.execute(select(User).order_by(User.created_at))
    return [_user_dict(u) for u in result.scalars().all()]


@router.put("/users/{user_id}/role")
async def update_role(
    user_id: str,
    body: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    if body.role not in ("admin", "analyst", "viewer"):
        raise HTTPException(400, "Invalid role. Must be admin, analyst, or viewer")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    user.role = body.role
    await db.commit()
    return _user_dict(user)


@router.put("/users/{user_id}/active")
async def toggle_active(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    if user.id == current_user.id:
        raise HTTPException(400, "Cannot deactivate your own account")
    user.is_active = not user.is_active
    await db.commit()
    return _user_dict(user)
