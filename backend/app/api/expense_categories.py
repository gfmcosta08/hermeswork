from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List, Optional

from app.database import get_db
from app.models.models import ExpenseCategory, User
from app.schemas.schemas import ExpenseCategoryCreate, ExpenseCategoryUpdate, ExpenseCategoryResponse
from app.core.deps import get_current_user

router = APIRouter(prefix="/expense-categories", tags=["expense-categories"])


@router.get("", response_model=List[ExpenseCategoryResponse])
async def list_expense_categories(
    active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(ExpenseCategory).where(ExpenseCategory.business_id == current_user.business_id)

    if active is not None:
        query = query.where(ExpenseCategory.active == active)

    result = await db.execute(query.order_by(ExpenseCategory.name))
    categories = result.scalars().all()

    return categories


@router.post("", response_model=ExpenseCategoryResponse)
async def create_expense_category(
    category_data: ExpenseCategoryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    category = ExpenseCategory(
        **category_data.model_dump(),
        business_id=current_user.business_id
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)

    return category


@router.put("/{category_id}", response_model=ExpenseCategoryResponse)
async def update_expense_category(
    category_id: UUID,
    category_data: ExpenseCategoryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(ExpenseCategory).where(
            ExpenseCategory.id == category_id,
            ExpenseCategory.business_id == current_user.business_id
        )
    )
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")

    update_data = category_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(category, key, value)

    await db.commit()
    await db.refresh(category)

    return category


@router.delete("/{category_id}")
async def delete_expense_category(
    category_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(ExpenseCategory).where(
            ExpenseCategory.id == category_id,
            ExpenseCategory.business_id == current_user.business_id
        )
    )
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")

    category.active = False
    await db.commit()

    return {"message": "Categoria desativada"}
