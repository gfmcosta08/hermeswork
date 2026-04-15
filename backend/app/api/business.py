from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.database import get_db
from app.models.models import Business, User
from app.schemas.schemas import BusinessCreate, BusinessUpdate, BusinessResponse
from app.core.deps import get_current_user

router = APIRouter(prefix="/business", tags=["business"])


@router.get("", response_model=BusinessResponse)
async def get_business(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Business).where(Business.id == current_user.business_id))
    business = result.scalar_one_or_none()

    if not business:
        raise HTTPException(status_code=404, detail="Negócio não encontrado")

    return business


@router.put("", response_model=BusinessResponse)
async def update_business(
    business_data: BusinessUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Business).where(Business.id == current_user.business_id))
    business = result.scalar_one_or_none()

    if not business:
        raise HTTPException(status_code=404, detail="Negócio não encontrado")

    update_data = business_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(business, key, value)

    await db.commit()
    await db.refresh(business)

    return business
