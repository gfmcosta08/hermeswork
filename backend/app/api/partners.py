from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List, Optional

from app.database import get_db
from app.models.models import Partner, User
from app.schemas.schemas import PartnerCreate, PartnerUpdate, PartnerResponse
from app.core.deps import get_current_user

router = APIRouter(prefix="/partners", tags=["partners"])


@router.get("", response_model=List[PartnerResponse])
async def list_partners(
    active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Partner).where(Partner.business_id == current_user.business_id)

    if active is not None:
        query = query.where(Partner.active == active)
    if search:
        query = query.where(Partner.name.ilike(f"%{search}%"))

    result = await db.execute(query.order_by(Partner.name))
    partners = result.scalars().all()

    return partners


@router.post("", response_model=PartnerResponse)
async def create_partner(
    partner_data: PartnerCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    partner = Partner(
        **partner_data.model_dump(),
        business_id=current_user.business_id
    )
    db.add(partner)
    await db.commit()
    await db.refresh(partner)

    return partner


@router.get("/{partner_id}", response_model=PartnerResponse)
async def get_partner(
    partner_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Partner).where(
            Partner.id == partner_id,
            Partner.business_id == current_user.business_id
        )
    )
    partner = result.scalar_one_or_none()

    if not partner:
        raise HTTPException(status_code=404, detail="Parceiro não encontrado")

    return partner


@router.put("/{partner_id}", response_model=PartnerResponse)
async def update_partner(
    partner_id: UUID,
    partner_data: PartnerUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Partner).where(
            Partner.id == partner_id,
            Partner.business_id == current_user.business_id
        )
    )
    partner = result.scalar_one_or_none()

    if not partner:
        raise HTTPException(status_code=404, detail="Parceiro não encontrado")

    update_data = partner_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(partner, key, value)

    await db.commit()
    await db.refresh(partner)

    return partner
