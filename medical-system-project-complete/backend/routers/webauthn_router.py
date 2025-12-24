import base64
import secrets

from config import settings
from database import get_db
from fastapi import APIRouter, Depends, HTTPException, Request
from models import User
from sqlalchemy.orm import Session
from utils.security import create_access_token

router = APIRouter()

# In-memory challenge stores (username -> challenge bytes)
_registration_challenges = {}
_authentication_challenges = {}


def _b64url_encode(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode("ascii")


def _b64url_decode(s: str) -> bytes:
    padding = "=" * (-len(s) % 4)
    return base64.urlsafe_b64decode(s + padding)


@router.get("/register/options")
async def register_options(username: str, db: Session = Depends(get_db)):
    """Return a registration challenge (client should call navigator.credentials.create)

    Note: This endpoint generates a random challenge and stores it server-side. For
    production, use a vetted WebAuthn library (python-fido2) to build full options
    and verify attestations. See TODOs below.
    """
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    challenge = secrets.token_bytes(32)
    _registration_challenges[username] = challenge

    options = {
        "challenge": _b64url_encode(challenge),
        "rp": {
            "name": settings.APP_NAME,
            "id": settings.APP_URL.replace("http://", "").replace("https://", ""),
        },
        "user": {
            "id": _b64url_encode(username.encode("utf-8")),
            "name": username,
            "displayName": username,
        },
        "pubKeyCredParams": [
            {"type": "public-key", "alg": -7},
            {"type": "public-key", "alg": -257},
        ],
        "authenticatorSelection": {"userVerification": "required"},
        "timeout": 60000,
        "attestation": "direct",
    }

    return options


@router.post("/register/verify")
async def register_verify(
    request: Request, username: str, db: Session = Depends(get_db)
):
    """Receive client response to registration and store credential id/public key.

    TODO: Replace this simplified flow with full attestation verification using
    python-fido2's server.register_complete. This implementation stores the raw
    credential id provided by the client and does not cryptographically verify
    the attestation — implement this before using in production.
    """
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    data = await request.json()

    state_challenge = _registration_challenges.get(username)
    if not state_challenge:
        raise HTTPException(status_code=400, detail="No registration in progress")

    # Expect client to send: id (base64url), rawId (base64url), response.attestationObject, response.clientDataJSON
    raw_id_b64 = data.get("rawId") or data.get("id")
    if not raw_id_b64:
        raise HTTPException(status_code=400, detail="Missing credential id")

    # Store credential_id as base64url string
    user.credential_id = raw_id_b64
    # For now store attestationObject as public_key placeholder (unsafe)
    attestation = data.get("response", {}).get("attestationObject") or data.get(
        "response", {}
    ).get("attestation")
    if attestation:
        user.public_key = attestation
    else:
        user.public_key = None

    user.sign_count = 0
    user.webauthn_enabled = True
    db.add(user)
    db.commit()

    # Clean up challenge
    _registration_challenges.pop(username, None)

    return {"status": "ok"}


@router.get("/login/options")
async def login_options(username: str, db: Session = Depends(get_db)):
    """Return authentication options (challenge + allowed credential ids)"""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.webauthn_enabled or not user.credential_id:
        raise HTTPException(
            status_code=400, detail="WebAuthn not enabled for this user"
        )

    challenge = secrets.token_bytes(32)
    _authentication_challenges[username] = challenge

    allow_credentials = [{"type": "public-key", "id": user.credential_id}]

    options = {
        "challenge": _b64url_encode(challenge),
        "allowCredentials": allow_credentials,
        "timeout": 60000,
        "userVerification": "required",
    }

    return options


@router.post("/login/verify")
async def login_verify(request: Request, username: str, db: Session = Depends(get_db)):
    """Verify authentication response; on success issue JWT.

    TODO: Replace this simplified flow with full signature verification using
    python-fido2's server.authenticate_complete. Current implementation matches
    credential id and issues JWT; it does NOT verify signature which must be
    implemented before relying on this in production.
    """
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    data = await request.json()

    state_challenge = _authentication_challenges.get(username)
    if not state_challenge:
        raise HTTPException(status_code=400, detail="No authentication in progress")

    # Client should send: id, rawId, response.authenticatorData, response.clientDataJSON, response.signature
    cred_id = data.get("id") or data.get("rawId")
    if not cred_id or cred_id != user.credential_id:
        raise HTTPException(status_code=400, detail="Credential not recognized")

    # NOTE: signature and authenticator data verification should occur here

    # Issue JWT on successful verification
    access_token = create_access_token(
        data={"sub": user.username, "is_admin": user.role == "admin"}
    )

    # Clean up challenge
    _authentication_challenges.pop(username, None)

    return {"access_token": access_token, "token_type": "bearer"}
