from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.models import Transaction, TransactionItem, Product, User
from app.schemas.schemas import (
    TransactionCreate, TransactionUpdate, TransactionResponse,
    TransactionItemCreate, TransactionItemResponse
)
from app.core.deps import get_current_user

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("", response_model=List[TransactionResponse])
async def list_transactions(
    type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    customer_id: Optional[UUID] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Transaction).where(Transaction.business_id == current_user.business_id)

    if type:
        query = query.where(Transaction.type == type)
    if status:
        query = query.where(Transaction.status == status)
    if customer_id:
        query = query.where(Transaction.customer_id == customer_id)

    result = await db.execute(query.order_by(Transaction.date_created.desc()))
    transactions = result.scalars().all()

    return transactions


@router.post("", response_model=TransactionResponse)
async def create_transaction(
    transaction_data: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    transaction = Transaction(
        **transaction_data.model_dump(),
        business_id=current_user.business_id
    )
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)

    return transaction


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.business_id == current_user.business_id
        )
    )
    transaction = result.scalar_one_or_none()

    if not transaction:
        raise HTTPException(status_code=404, detail="Transação não encontrada")

    return transaction


@router.put("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: UUID,
    transaction_data: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.business_id == current_user.business_id
        )
    )
    transaction = result.scalar_one_or_none()

    if not transaction:
        raise HTTPException(status_code=404, detail="Transação não encontrada")

    update_data = transaction_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(transaction, key, value)

    await db.commit()
    await db.refresh(transaction)

    return transaction


@router.delete("/{transaction_id}")
async def delete_transaction(
    transaction_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.business_id == current_user.business_id
        )
    )
    transaction = result.scalar_one_or_none()

    if not transaction:
        raise HTTPException(status_code=404, detail="Transação não encontrada")

    await db.delete(transaction)
    await db.commit()

    return {"message": "Transação removida"}


@router.post("/{transaction_id}/confirm", response_model=TransactionResponse)
async def confirm_transaction(
    transaction_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.business_id == current_user.business_id
        )
    )
    transaction = result.scalar_one_or_none()

    if not transaction:
        raise HTTPException(status_code=404, detail="Transação não encontrada")

    transaction.status = "confirmado"
    await db.commit()
    await db.refresh(transaction)

    return transaction


@router.post("/{transaction_id}/cancel", response_model=TransactionResponse)
async def cancel_transaction(
    transaction_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.business_id == current_user.business_id
        )
    )
    transaction = result.scalar_one_or_none()

    if not transaction:
        raise HTTPException(status_code=404, detail="Transação não encontrada")

    transaction.status = "cancelado"
    await db.commit()
    await db.refresh(transaction)

    return transaction


@router.get("/{transaction_id}/items", response_model=List[TransactionItemResponse])
async def list_transaction_items(
    transaction_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.business_id == current_user.business_id
        )
    )
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transação não encontrada")

    result = await db.execute(
        select(TransactionItem).where(TransactionItem.transaction_id == transaction_id)
    )
    items = result.scalars().all()

    return items


@router.post("/{transaction_id}/items", response_model=TransactionItemResponse)
async def create_transaction_item(
    transaction_id: UUID,
    item_data: TransactionItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.business_id == current_user.business_id
        )
    )
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transação não encontrada")

    result = await db.execute(
        select(Product).where(
            Product.id == item_data.product_id,
            Product.business_id == current_user.business_id
        )
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    item = TransactionItem(
        **item_data.model_dump(),
        transaction_id=transaction_id
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)

    return item
