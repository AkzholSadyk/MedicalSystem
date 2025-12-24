"""
Medications Router - REST API endpoints for Medications/Drugs Market feature.

Architecture:
- This router exposes clean REST API endpoints to the frontend
- Backend acts as a proxy: openFDA API -> Backend -> Database -> Frontend
- Database acts as a cache to avoid repeated API calls
- Frontend NEVER calls openFDA directly (API keys and external APIs are hidden)
"""

import logging
import os
from typing import List, Optional

import schemas
from database import get_db
from dependencies import get_current_user, require_role
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from models import Medication, User
from sqlalchemy import or_
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("", response_model=List[schemas.MedicationRead])
async def get_medications(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search medications by name"),
    form: Optional[str] = Query(
        None, description="Filter by medication form (tablet, capsule, etc.)"
    ),
    generic_name: Optional[str] = Query(None, description="Filter by generic name"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return medications stored in the internal database.
    Patients/regular users will only receive medications that were added
    by pharmacists (created_by != NULL). Admins can see all medications.
    """
    query = db.query(Medication)

    # Apply filters
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Medication.name.ilike(search_filter),
                Medication.generic_name.ilike(search_filter),
            )
        )

    if form:
        query = query.filter(Medication.form.ilike(f"%{form}%"))

    if generic_name:
        query = query.filter(Medication.generic_name.ilike(f"%{generic_name}%"))

    # Restrict to pharmacist-created entries for non-admins
    if getattr(current_user, "role", None) != "admin":
        query = query.filter(Medication.created_by.isnot(None))

    medications = query.order_by(Medication.name).offset(skip).limit(limit).all()
    return medications


@router.get("/search", response_model=List[schemas.MedicationRead])
async def search_medications(
    q: str = Query(..., description="Search query for medications"),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Search medications by query string.

    First checks database cache, then fetches from openFDA if not found.
    Stores results in database for future use.

    Architecture follows: Database -> openFDA -> Database -> Response
    """
    # Search DB only
    search_filter = f"%{q}%"
    query = db.query(Medication).filter(
        or_(
            Medication.name.ilike(search_filter),
            Medication.generic_name.ilike(search_filter),
        )
    )

    if getattr(current_user, "role", None) != "admin":
        query = query.filter(Medication.created_by.isnot(None))

    medications = query.order_by(Medication.name).limit(limit).all()
    return medications


@router.get("/{medication_id}", response_model=schemas.MedicationRead)
async def get_medication(
    medication_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific medication by ID.

    Returns medication from database only (not from openFDA).
    """
    medication = db.query(Medication).filter(Medication.id == medication_id).first()

    if not medication:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found"
        )

    return medication


@router.post(
    "", response_model=schemas.MedicationRead, status_code=status.HTTP_201_CREATED
)
async def create_medication(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    form: Optional[str] = Form(None),
    generic_name: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["pharmacist", "admin"])),
):
    # Validate inputs
    if not name or not name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Name required"
        )

    med = Medication(
        name=name.strip(),
        description=description,
        form=form,
        generic_name=generic_name,
        created_by=current_user.id,
    )

    # Handle image upload
    if image:
        uploads_dir = os.path.join(os.getcwd(), "static", "uploads")
        os.makedirs(uploads_dir, exist_ok=True)
        safe_name = f"med_{int(__import__('time').time())}_{image.filename}"
        file_path = os.path.join(uploads_dir, safe_name)
        with open(file_path, "wb") as f:
            f.write(await image.read())
        med.stored_image = f"/static/uploads/{safe_name}"

    db.add(med)
    db.commit()
    db.refresh(med)
    return med


@router.put("/{medication_id}", response_model=schemas.MedicationRead)
async def update_medication(
    medication_id: int,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    form: Optional[str] = Form(None),
    generic_name: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    med = db.query(Medication).filter(Medication.id == medication_id).first()
    if not med:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found"
        )

    # Ownership check: pharmacists can only edit their own medications
    if current_user.role == "pharmacist" and med.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to edit this medication",
        )

    if name is not None:
        med.name = name.strip()
    if description is not None:
        med.description = description
    if form is not None:
        med.form = form
    if generic_name is not None:
        med.generic_name = generic_name

    if image:
        uploads_dir = os.path.join(os.getcwd(), "static", "uploads")
        os.makedirs(uploads_dir, exist_ok=True)
        safe_name = f"med_{int(__import__('time').time())}_{image.filename}"
        file_path = os.path.join(uploads_dir, safe_name)
        with open(file_path, "wb") as f:
            f.write(await image.read())
        med.stored_image = f"/static/uploads/{safe_name}"

    db.add(med)
    db.commit()
    db.refresh(med)
    return med


@router.delete("/{medication_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_medication(
    medication_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    med = db.query(Medication).filter(Medication.id == medication_id).first()
    if not med:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found"
        )

    if current_user.role == "pharmacist" and med.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to delete this medication",
        )

    # If stored image exists, attempt delete file
    try:
        if med.stored_image:
            # stored_image is like '/static/uploads/filename'
            rel = med.stored_image.lstrip("/")
            fs_path = os.path.join(os.getcwd(), rel)
            if os.path.exists(fs_path):
                os.remove(fs_path)
    except Exception:
        logger.exception("Failed to remove stored image file")

    db.delete(med)
    db.commit()
    return


@router.post("/sync", response_model=List[schemas.MedicationRead])
async def sync_medications_from_openfda(
    search_term: str = Query(..., description="Search term to fetch from openFDA"),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Manually sync medications from openFDA API to database.

    Fetches medications from openFDA and stores them in the database.
    Useful for populating the database with common medications.

    Architecture: openFDA API -> Normalize -> Database -> Response
    """
    # Deprecated: external sync removed. Keep endpoint to allow admins to
    # populate meds manually via the create endpoint or by uploading a CSV in future.
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail="External sync removed. Use POST /medications to create internal records.",
    )
