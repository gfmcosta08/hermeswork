from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List, Optional

from app.database import get_db
from app.models.models import Corretor, User
from app.schemas.schemas import CorretorCreate, CorretorUpdate, CorretorResponse
from app.core.deps import get_current_user

router = APIRouter(prefix="/corretors", tags=["corretors"])


@router.get("", response_model=List[CorretorResponse])
async def list_corretors(
    active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Corretor).where(Corretor.business_id == current_user.business_id)

    if active is not None:
        query = query.where(Corretor.active == active)
    if search:
        query = query.where(Corretor.name.ilike(f"%{search}%"))

    result = await db.execute(query.order_by(Corretor.name))
    corretors = result.scalars().all()

    return corretors


@router.post("", response_model=CorretorResponse)
async def create_corretor(
    corretor_data: CorretorCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    corretor = Corretor(
        **corretor_data.model_dump(),
        business_id=current_user.business_id
    )
    db.add(corretor)
    await db.commit()
    await db.refresh(corretor)

    return corretor


@router.get("/{corretor_id}", response_model=CorretorResponse)
async def get_corretor(
    corretor_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Corretor).where(
            Corretor.id == corretor_id,
            Corretor.business_id == current_user.business_id
        )
    )
    corretor = result.scalar_one_or_none()

    if not corretor:
        raise HTTPException(status_code=404, detail="Corretor não encontrado")

    return corretor


@router.put("/{corretor_id}", response_model=CorretorResponse)
async def update_corretor(
    corretor_id: UUID,
    corretor_data: CorretorUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Corretor).where(
            Corretor.id == corretor_id,
            Corretor.business_id == current_user.business_id
        )
    )
    corretor = result.scalar_one_or_none()

    if not corretor:
        raise HTTPException(status_code=404, detail="Corretor não encontrado")

    update_data = corretor_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(corretor, key, value)

    await db.commit()
    await db.refresh(corretor)

    return corretor


@router.delete("/{corretor_id}")
async def delete_corretor(
    corretor_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Corretor).where(
            Corretor.id == corretor_id,
            Corretor.business_id == current_user.business_id
        )
    )
    corretor = result.scalar_one_or_none()

    if not corretor:
        raise HTTPException(status_code=404, detail="Corretor não encontrado")

    corretor.active = False
    await db.commit()

    return {"message": "Corretor desativado"}
