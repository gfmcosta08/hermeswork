from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List, Optional

from app.database import get_db
from app.models.models import Supplier, User
from app.schemas.schemas import SupplierCreate, SupplierUpdate, SupplierResponse
from app.core.deps import get_current_user

router = APIRouter(prefix="/suppliers", tags=["suppliers"])


@router.get("", response_model=List[SupplierResponse])
async def list_suppliers(
    active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Supplier).where(Supplier.business_id == current_user.business_id)

    if active is not None:
        query = query.where(Supplier.active == active)
    if search:
        query = query.where(Supplier.name.ilike(f"%{search}%"))

    result = await db.execute(query.order_by(Supplier.name))
    suppliers = result.scalars().all()

    return suppliers


@router.post("", response_model=SupplierResponse)
async def create_supplier(
    supplier_data: SupplierCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    supplier = Supplier(
        **supplier_data.model_dump(),
        business_id=current_user.business_id
    )
    db.add(supplier)
    await db.commit()
    await db.refresh(supplier)

    return supplier


@router.get("/{supplier_id}", response_model=SupplierResponse)
async def get_supplier(
    supplier_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Supplier).where(
            Supplier.id == supplier_id,
            Supplier.business_id == current_user.business_id
        )
    )
    supplier = result.scalar_one_or_none()

    if not supplier:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")

    return supplier


@router.put("/{supplier_id}", response_model=SupplierResponse)
async def update_supplier(
    supplier_id: UUID,
    supplier_data: SupplierUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Supplier).where(
            Supplier.id == supplier_id,
            Supplier.business_id == current_user.business_id
        )
    )
    supplier = result.scalar_one_or_none()

    if not supplier:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")

    update_data = supplier_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(supplier, key, value)

    await db.commit()
    await db.refresh(supplier)

    return supplier
