from config import settings
from database import engine, get_db
from dependencies import get_current_user
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from models import Doctor, Patient, User
from schemas import Token, UserCreate, UserRead  # Pydantic
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session
from utils.security import create_access_token, get_password_hash, verify_password

router = APIRouter()


def _user_to_userread(user: User) -> UserRead:
    """Build a UserRead Pydantic model from SQLAlchemy User, pulling first/last name from related profiles."""
    first_name = None
    last_name = None
    if hasattr(user, "patient") and user.patient:
        first_name = user.patient.first_name
        last_name = user.patient.last_name
    elif hasattr(user, "doctor") and user.doctor:
        first_name = user.doctor.first_name
        last_name = user.doctor.last_name
    else:
        # No profile (e.g. admin) — make fields empty strings to satisfy schema
        first_name = ""
        last_name = ""

    return UserRead(
        id=user.id,
        username=user.username,
        first_name=first_name,
        last_name=last_name,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
    )


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user
    """
    # Check if username already exists
    existing_user = (
        db.query(User)
        .filter((User.username == user_data.username) | (User.email == user_data.email))
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered",
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        role=user_data.role,
        is_active=True,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create patient or doctor profile based on role
    if user_data.role == "patient":
        patient = Patient(
            user_id=new_user.id,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            patronymic=getattr(user_data, "patronymic", None),
            phone=getattr(user_data, "phone", None),
            date_of_birth=getattr(user_data, "date_of_birth", None),
            city=getattr(user_data, "city", None),
        )
        db.add(patient)
        db.commit()
    elif user_data.role == "doctor":
        doctor = Doctor(
            user_id=new_user.id,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            patronymic=getattr(user_data, "patronymic", None),
            phone=getattr(user_data, "phone", None),
            city=getattr(user_data, "city", None),
        )
        db.add(doctor)
        db.commit()

    # Create access token
    access_token = create_access_token(
        data={"sub": new_user.username, "is_admin": new_user.role == "admin"}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": _user_to_userread(new_user),
    }


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    """
    Login user and return JWT token
    """
    # Special-case: if ADMIN_USERNAME and ADMIN_PASSWORD set in env, allow direct admin login
    if settings.ADMIN_USERNAME and settings.ADMIN_PASSWORD:
        if (
            form_data.username == settings.ADMIN_USERNAME
            and form_data.password == settings.ADMIN_PASSWORD
        ):
            # ensure admin user exists in DB; create if missing
            user = (
                db.query(User).filter(User.username == settings.ADMIN_USERNAME).first()
            )
            if not user:
                hashed = get_password_hash(settings.ADMIN_PASSWORD)
                user = User(
                    username=settings.ADMIN_USERNAME,
                    email=f"{settings.ADMIN_USERNAME}@example.com",
                    hashed_password=hashed,
                    role="admin",
                    is_active=True,
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            else:
                # If existing admin user has an invalid email (e.g. '@local') update it
                try:
                    domain = user.email.split("@")[1]
                except Exception:
                    domain = ""
                if user.email.endswith("@local") or "." not in domain:
                    user.email = f"{user.username}@example.com"
                    db.add(user)
                    db.commit()
                    db.refresh(user)
        else:
            user = db.query(User).filter(User.username == form_data.username).first()
    else:
        # Find user by username
        try:
            user = db.query(User).filter(User.username == form_data.username).first()
        except OperationalError as oe:
            # Handle missing WebAuthn columns on older DBs: attempt runtime migration then retry
            msg = str(oe).lower()
            if "no such column" in msg and "credential_id" in msg:
                try:
                    with engine.connect() as conn:
                        res = conn.execute(text("PRAGMA table_info(users)")).fetchall()
                        cols = [r[1] for r in res]
                        if "credential_id" not in cols:
                            conn.execute(
                                text("ALTER TABLE users ADD COLUMN credential_id TEXT")
                            )
                        if "public_key" not in cols:
                            conn.execute(
                                text("ALTER TABLE users ADD COLUMN public_key TEXT")
                            )
                        if "sign_count" not in cols:
                            conn.execute(
                                text(
                                    "ALTER TABLE users ADD COLUMN sign_count INTEGER DEFAULT 0"
                                )
                            )
                        if "webauthn_enabled" not in cols:
                            conn.execute(
                                text(
                                    "ALTER TABLE users ADD COLUMN webauthn_enabled BOOLEAN DEFAULT 0"
                                )
                            )
                except Exception:
                    # fall through to re-raise original error
                    raise

                # retry the query once
                user = (
                    db.query(User).filter(User.username == form_data.username).first()
                )
            else:
                raise

    # Verify password (for env-admin bypass, user.hashed_password exists and equals env hash)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user account"
        )

    # Create access token
    access_token = create_access_token(
        data={"sub": user.username, "is_admin": user.role == "admin"}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": _user_to_userread(user),
    }


@router.get("/me", response_model=UserRead)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return _user_to_userread(current_user)
