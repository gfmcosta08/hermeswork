from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List, Optional

from app.database import get_db
from app.models.models import Inventory, InventoryMovement, User
from app.schemas.schemas import (
    InventoryCreate, InventoryUpdate, InventoryResponse,
    InventoryMovementCreate, InventoryMovementResponse
)
from app.core.deps import get_current_user

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("", response_model=List[InventoryResponse])
async def list_inventory(
    active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    low_stock: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Inventory).where(Inventory.business_id == current_user.business_id)

    if active is not None:
        query = query.where(Inventory.active == active)
    if search:
        query = query.where(Inventory.name.ilike(f"%{search}%"))

    result = await db.execute(query.order_by(Inventory.name))
    items = result.scalars().all()

    if low_stock:
        items = [i for i in items if i.quantity <= i.min_threshold]

    return items


@router.post("", response_model=InventoryResponse)
async def create_inventory(
    inventory_data: InventoryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    inventory = Inventory(
        **inventory_data.model_dump(),
        business_id=current_user.business_id
    )
    db.add(inventory)
    await db.commit()
    await db.refresh(inventory)

    return inventory


@router.get("/{inventory_id}", response_model=InventoryResponse)
async def get_inventory(
    inventory_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Inventory).where(
            Inventory.id == inventory_id,
            Inventory.business_id == current_user.business_id
        )
    )
    inventory = result.scalar_one_or_none()

    if not inventory:
        raise HTTPException(status_code=404, detail="Item não encontrado")

    return inventory


@router.put("/{inventory_id}", response_model=InventoryResponse)
async def update_inventory(
    inventory_id: UUID,
    inventory_data: InventoryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Inventory).where(
            Inventory.id == inventory_id,
            Inventory.business_id == current_user.business_id
        )
    )
    inventory = result.scalar_one_or_none()

    if not inventory:
        raise HTTPException(status_code=404, detail="Item não encontrado")

    update_data = inventory_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(inventory, key, value)

    await db.commit()
    await db.refresh(inventory)

    return inventory


@router.delete("/{inventory_id}")
async def delete_inventory(
    inventory_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Inventory).where(
            Inventory.id == inventory_id,
            Inventory.business_id == current_user.business_id
        )
    )
    inventory = result.scalar_one_or_none()

    if not inventory:
        raise HTTPException(status_code=404, detail="Item não encontrado")

    inventory.active = False
    await db.commit()

    return {"message": "Item desativado"}


@router.post("/movement", response_model=InventoryMovementResponse)
async def create_movement(
    movement_data: InventoryMovementCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Inventory).where(
            Inventory.id == movement_data.inventory_id,
            Inventory.business_id == current_user.business_id
        )
    )
    inventory = result.scalar_one_or_none()

    if not inventory:
        raise HTTPException(status_code=404, detail="Item não encontrado")

    movement = InventoryMovement(
        **movement_data.model_dump()
    )
    db.add(movement)

    inventory.quantity += movement_data.quantity

    await db.commit()
    await db.refresh(movement)

    return movement


@router.get("/{inventory_id}/movements", response_model=List[InventoryMovementResponse])
async def list_movements(
    inventory_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Inventory).where(
            Inventory.id == inventory_id,
            Inventory.business_id == current_user.business_id
        )
    )
    inventory = result.scalar_one_or_none()
    if not inventory:
        raise HTTPException(status_code=404, detail="Item não encontrado")

    result = await db.execute(
        select(InventoryMovement)
        .where(InventoryMovement.inventory_id == inventory_id)
        .order_by(InventoryMovement.date_created.desc())
    )
    movements = result.scalars().all()

    return movements
