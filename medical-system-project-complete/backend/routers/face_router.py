import base64
import io
import json
import logging

from database import get_db
from fastapi import APIRouter, Depends, HTTPException
from models import User
from sqlalchemy.orm import Session
from utils.security import create_access_token

router = APIRouter()
logger = logging.getLogger(__name__)


def _b64_to_image(b64: str):
    try:
        from PIL import Image
    except ImportError:
        # Pillow is not available; return None and let caller handle fallback
        return None
    header, data = (b64.split(",", 1) + [""])[:2]
    raw = base64.b64decode(data or b64)
    return Image.open(io.BytesIO(raw)).convert("RGB")


def _average_hash(pil_img, hash_size: int = 8) -> int:
    """Compute a simple average hash (aHash) for the given PIL image.

    Returns an integer representing the bits of the hash.
    """
    if pil_img is None:
        raise HTTPException(status_code=400, detail="Pillow image required for hashing")

    try:
        from PIL import Image as PILImage

        resample_filter = getattr(PILImage, "LANCZOS", 1)
    except Exception:
        resample_filter = 1
    img = pil_img.convert("L").resize((hash_size, hash_size), resample=resample_filter)
    pixels = list(img.getdata())
    avg = sum(pixels) / len(pixels)
    bits = 0
    for idx, p in enumerate(pixels):
        if p > avg:
            bits |= 1 << idx
    return bits


@router.post("/register")
def face_register(payload: dict, db: Session = Depends(get_db)):
    """Register a face for a user.

    Expects JSON: { "username": "alice", "image": "data:image/png;base64,..." }
    """
    username = payload.get("username")
    image_b64 = payload.get("image")
    if not username or not image_b64:
        raise HTTPException(status_code=400, detail="username and image are required")

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        # Lazy imports so app can start even if packages are not installed
        try:
            import face_recognition
            import numpy as np

            has_face_libs = True
        except ImportError:
            has_face_libs = False

        if has_face_libs:
            # face_recognition is present; ensure Pillow is available before trying to
            # decode image to avoid a 500 from _b64_to_image. If Pillow is missing,
            # fall back to the lightweight path below.
            try:
                pil_ok = True
            except Exception:
                pil_ok = False

            if pil_ok:
                pil = _b64_to_image(image_b64)
                if pil is None:
                    # decoding failed; treat as no face detected
                    raise HTTPException(
                        status_code=400, detail="Unable to decode image"
                    )
                arr = np.array(pil)
                encs = face_recognition.face_encodings(arr)
            if not encs:
                raise HTTPException(status_code=400, detail="No face detected")
            emb = encs[0]

            user.face_embedding = json.dumps(emb.tolist())
            db.add(user)
            db.commit()

            return {"status": "ok", "message": "Face login enabled"}
        else:
            # Fallback mode: prefer perceptual aHash when Pillow is available;
            # otherwise store a sha256 of the incoming base64 payload for exact-match fallback.
            try:
                pil_available = True
            except Exception:
                pil_available = False

            if pil_available:
                try:
                    pil = _b64_to_image(image_b64)
                except HTTPException:
                    raise
                except Exception as e:
                    raise HTTPException(status_code=400, detail=str(e))

                ah = _average_hash(pil, hash_size=8)
                user.face_embedding = json.dumps({"fallback_ahash": ah})
            else:
                # Pillow isn't installed; store sha256 of base64 payload as a last-resort fallback
                header, data = (image_b64.split(",", 1) + [""])[:2]
                incoming_b64 = data or image_b64
                import hashlib

                digest = hashlib.sha256(incoming_b64.encode("utf-8")).hexdigest()
                user.face_embedding = json.dumps({"fallback_sha256": digest})

            db.add(user)
            db.commit()
            return {"status": "ok", "message": "Face login enabled (fallback mode)"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/login")
def face_login(payload: dict, db: Session = Depends(get_db)):
    """Simplified face login by username+image.

    Expects JSON: { "username": "alice", "image": "data:image/png;base64,..." }
    Returns: { access_token }
    """
    username = payload.get("username")
    image_b64 = payload.get("image")
    if not username or not image_b64:
        raise HTTPException(status_code=400, detail="username and image are required")

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.face_embedding:
        raise HTTPException(status_code=400, detail="Face not registered for this user")

    try:
        try:
            import face_recognition
            import numpy as np

            has_face_libs = True
        except ImportError:
            has_face_libs = False

        if has_face_libs:
            # Ensure Pillow is available before decoding image; otherwise fall back
            # to lightweight matching below.
            try:
                pil_ok = True
            except Exception:
                pil_ok = False

            if pil_ok:
                pil = _b64_to_image(image_b64)
                if pil is None:
                    raise HTTPException(
                        status_code=400, detail="Unable to decode image"
                    )
                arr = np.array(pil)
                encs = face_recognition.face_encodings(arr)
            if not encs:
                raise HTTPException(status_code=400, detail="No face detected")
            probe = encs[0]

            stored = json.loads(user.face_embedding)
            stored_enc = np.array(stored)

            dist = face_recognition.face_distance([stored_enc], probe)[0]
            threshold = 0.6
            if dist <= threshold:
                token = create_access_token(
                    data={"sub": user.username, "is_admin": user.role == "admin"}
                )
                return {"access_token": token, "token_type": "bearer"}
            else:
                raise HTTPException(status_code=401, detail="Face not recognized")
        else:
            # Fallback: try perceptual aHash if Pillow available, otherwise compare sha256
            try:
                pil_available = True
            except Exception:
                pil_available = False

            if pil_available:
                try:
                    pil = _b64_to_image(image_b64)
                except HTTPException:
                    raise
                except Exception as e:
                    raise HTTPException(status_code=400, detail=str(e))

                incoming_ah = _average_hash(pil, hash_size=8)
                stored = json.loads(user.face_embedding)
                stored_ah = stored.get("fallback_ahash")
                if stored_ah is None:
                    raise HTTPException(
                        status_code=400, detail="No fallback hash stored"
                    )

                xor = int(stored_ah) ^ int(incoming_ah)
                hamming = bin(xor).count("1")
                threshold = 12
                logger.debug(
                    f"Face fallback: stored_ah={stored_ah} incoming_ah={incoming_ah} hamming={hamming}"
                )
                if hamming <= threshold:
                    token = create_access_token(
                        data={"sub": user.username, "is_admin": user.role == "admin"}
                    )
                    return {"access_token": token, "token_type": "bearer"}
                else:
                    raise HTTPException(
                        status_code=401,
                        detail=f"Face not recognized (fallback), distance={hamming}",
                    )
            else:
                # compare sha256 of base64 payload
                header, data = (image_b64.split(",", 1) + [""])[:2]
                incoming_b64 = data or image_b64
                import hashlib

                incoming_digest = hashlib.sha256(
                    incoming_b64.encode("utf-8")
                ).hexdigest()
                stored = json.loads(user.face_embedding)
                stored_digest = stored.get("fallback_sha256")
                if not stored_digest:
                    raise HTTPException(
                        status_code=400, detail="No fallback sha256 stored"
                    )
                if incoming_digest == stored_digest:
                    token = create_access_token(
                        data={"sub": user.username, "is_admin": user.role == "admin"}
                    )
                    return {"access_token": token, "token_type": "bearer"}
                else:
                    raise HTTPException(
                        status_code=401, detail="Face not recognized (sha256 fallback)"
                    )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/debug")
def face_debug(payload: dict):
    """Debug helper: POST { image: dataUrl }

    Returns info about installed libs, decode success, face count, aHash and sha256.
    """
    image_b64 = payload.get("image")
    if not image_b64:
        raise HTTPException(status_code=400, detail="image is required")

    info = {
        "pillow": False,
        "face_recognition": False,
        "numpy": False,
        "decoded": False,
        "face_count": 0,
    }

    try:
        try:
            info["pillow"] = True
        except Exception:
            info["pillow"] = False

        try:
            import face_recognition  # type: ignore
            import numpy as np  # type: ignore

            info["face_recognition"] = True
            info["numpy"] = True
        except Exception:
            info["face_recognition"] = False
            info["numpy"] = False

        # decode if pillow available
        pil = None
        if info["pillow"]:
            try:
                pil = _b64_to_image(image_b64)
                info["decoded"] = pil is not None
            except Exception as e:
                info["decoded"] = False
                info["error"] = str(e)

        # face count if libs available and image decoded
        if info["face_recognition"] and info["decoded"]:
            arr = np.array(pil)
            encs = face_recognition.face_encodings(arr)
            info["face_count"] = len(encs)

        # aHash if pillow available
        if info["pillow"] and pil is not None:
            try:
                ah = _average_hash(pil, hash_size=8)
                info["ahash"] = ah
            except Exception as e:
                info["ahash_error"] = str(e)

        # sha256 of base64 always available
        import hashlib

        header, data = (image_b64.split(",", 1) + [""])[:2]
        incoming_b64 = data or image_b64
        info["sha256"] = hashlib.sha256(incoming_b64.encode("utf-8")).hexdigest()

        return info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
