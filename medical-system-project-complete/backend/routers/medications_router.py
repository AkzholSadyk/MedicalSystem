"""
Medications Router - REST API endpoints for Medications/Drugs Market feature.

Architecture:
- This router exposes clean REST API endpoints to the frontend
- Backend acts as a proxy: openFDA API -> Backend -> Database -> Frontend
- Database acts as a cache to avoid repeated API calls
- Frontend NEVER calls openFDA directly (API keys and external APIs are hidden)
"""
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

import schemas
from database import get_db
from dependencies import get_current_user
from models import Medication, User
from services.medications_service import medications_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("", response_model=List[schemas.MedicationRead])
async def get_medications(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search medications by name"),
    form: Optional[str] = Query(None, description="Filter by medication form (tablet, capsule, etc.)"),
    generic_name: Optional[str] = Query(None, description="Filter by generic name"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get list of medications from the database.
    
    If search parameter is provided, searches in both database and openFDA API.
    Database acts as a cache - if medication is found in DB, returns cached version.
    If not found in DB, fetches from openFDA and stores in database.
    
    Architecture: Database Cache -> openFDA (if not cached) -> Store -> Return
    """
    query = db.query(Medication)
    
    # Apply filters
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Medication.name.ilike(search_filter),
                Medication.generic_name.ilike(search_filter)
            )
        )
    
    if form:
        query = query.filter(Medication.form.ilike(f"%{form}%"))
    
    if generic_name:
        query = query.filter(Medication.generic_name.ilike(f"%{generic_name}%"))
    
    # Get medications from database
    medications = query.order_by(Medication.name).offset(skip).limit(limit).all()
    
    # If search provided and no results in DB, fetch from openFDA and cache
    if search and not medications:
        try:
            # Fetch from openFDA API (via service)
            openfda_results = await medications_service.search_medications(
                search_term=search, 
                limit=min(limit * 2, 50)  # Fetch more to have better results
            )
            
            # Store in database for future use (cache)
            for med_data in openfda_results:
                # Check if already exists (avoid duplicates)
                existing = db.query(Medication).filter(
                    Medication.name.ilike(f"%{med_data['name']}%")
                ).first()
                
                if not existing:
                    new_medication = Medication(**med_data)
                    db.add(new_medication)
            
            db.commit()
            
            # Re-query to get the stored medications
            query = db.query(Medication)
            if search:
                search_filter = f"%{search}%"
                query = query.filter(
                    or_(
                        Medication.name.ilike(search_filter),
                        Medication.generic_name.ilike(search_filter)
                    )
                )
            if form:
                query = query.filter(Medication.form.ilike(f"%{form}%"))
            if generic_name:
                query = query.filter(Medication.generic_name.ilike(f"%{generic_name}%"))
            
            medications = query.order_by(Medication.name).offset(skip).limit(limit).all()
            
        except Exception as e:
            # If openFDA fails, return empty list (graceful degradation)
            logger.error(f"Error fetching from openFDA: {e}")
            medications = []
    
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
    # First check database
    search_filter = f"%{q}%"
    medications = db.query(Medication).filter(
        or_(
            Medication.name.ilike(search_filter),
            Medication.generic_name.ilike(search_filter)
        )
    ).order_by(Medication.name).limit(limit).all()
    
    # If no results in DB, fetch from openFDA
    if not medications:
        try:
            openfda_results = await medications_service.search_medications(
                search_term=q,
                limit=limit
            )
            
            # Store in database
            for med_data in openfda_results:
                existing = db.query(Medication).filter(
                    Medication.name.ilike(f"%{med_data['name']}%")
                ).first()
                
                if not existing:
                    new_medication = Medication(**med_data)
                    db.add(new_medication)
            
            db.commit()
            
            # Return the newly stored medications
            medications = db.query(Medication).filter(
                or_(
                    Medication.name.ilike(search_filter),
                    Medication.generic_name.ilike(search_filter)
                )
            ).order_by(Medication.name).limit(limit).all()
            
        except Exception as e:
            logger.error(f"Error searching medications: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Unable to search medications: {str(e)}"
            )
    
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
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medication not found"
        )
    
    return medication


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
    try:
        # Fetch from openFDA
        openfda_results = await medications_service.search_medications(
            search_term=search_term,
            limit=limit
        )
        
        added_medications = []
        for med_data in openfda_results:
            # Check if exists
            existing = db.query(Medication).filter(
                Medication.name.ilike(f"%{med_data['name']}%")
            ).first()
            
            if not existing:
                new_medication = Medication(**med_data)
                db.add(new_medication)
                added_medications.append(new_medication)
        
        db.commit()
        
        # Refresh to get IDs
        for med in added_medications:
            db.refresh(med)
        
        return added_medications
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error syncing medications: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Unable to sync medications from openFDA: {str(e)}"
        )

