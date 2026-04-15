from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from uuid import UUID
from typing import List, Optional
from datetime import date
from decimal import Decimal

from app.database import get_db
from app.models.models import FinancialEntry, User
from app.schemas.schemas import (
    FinancialEntryCreate, FinancialEntryResponse, FinancialReportRequest, FinancialReportResponse
)
from app.core.deps import get_current_user

router = APIRouter(prefix="/financial", tags=["financial"])


@router.get("", response_model=List[FinancialEntryResponse])
async def list_financial_entries(
    type: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    confirmed: Optional[bool] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(FinancialEntry).where(FinancialEntry.business_id == current_user.business_id)

    if type:
        query = query.where(FinancialEntry.type == type)
    if category:
        query = query.where(FinancialEntry.category == category)
    if confirmed is not None:
        query = query.where(FinancialEntry.confirmed == confirmed)
    if start_date:
        query = query.where(FinancialEntry.date_created >= start_date)
    if end_date:
        query = query.where(FinancialEntry.date_created <= end_date)

    result = await db.execute(query.order_by(FinancialEntry.date_created.desc()))
    entries = result.scalars().all()

    return entries


@router.post("", response_model=FinancialEntryResponse)
async def create_financial_entry(
    entry_data: FinancialEntryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    entry = FinancialEntry(
        **entry_data.model_dump(exclude_unset=True),
        business_id=current_user.business_id
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)

    return entry


@router.get("/report", response_model=FinancialReportResponse)
async def get_financial_report(
    report_data: FinancialReportRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(FinancialEntry).where(FinancialEntry.business_id == current_user.business_id)

    if report_data.start_date:
        query = query.where(FinancialEntry.date_created >= report_data.start_date)
    if report_data.end_date:
        query = query.where(FinancialEntry.date_created <= report_data.end_date)
    if report_data.type:
        query = query.where(FinancialEntry.type == report_data.type)
    if report_data.category:
        query = query.where(FinancialEntry.category == report_data.category)

    result = await db.execute(query)
    entries = list(result.scalars().all())

    entradas = [e for e in entries if e.type == "receita"]
    saidas = [e for e in entries if e.type == "despesa"]

    total_receitas = sum(e.amount for e in entradas)
    total_despesas = sum(e.amount for e in saidas)

    por_categoria = {}
    for e in entries:
        cat = e.category or "outro"
        if cat not in por_categoria:
            por_categoria[cat] = Decimal("0")
        por_categoria[cat] += e.amount

    por_metodo = {}
    for e in entries:
        if e.payment_method:
            if e.payment_method not in por_metodo:
                por_metodo[e.payment_method] = Decimal("0")
            por_metodo[e.payment_method] += e.amount

    return FinancialReportResponse(
        total_receitas=total_receitas,
        total_despesas=total_despesas,
        saldo=total_receitas - total_despesas,
        por_categoria=por_categoria,
        por_metodo=por_metodo,
        entradas=entradas,
        saidas=saidas
    )


@router.get("/{entry_id}", response_model=FinancialEntryResponse)
async def get_financial_entry(
    entry_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(FinancialEntry).where(
            FinancialEntry.id == entry_id,
            FinancialEntry.business_id == current_user.business_id
        )
    )
    entry = result.scalar_one_or_none()

    if not entry:
        raise HTTPException(status_code=404, detail="Entry não encontrado")

    return entry


@router.put("/{entry_id}/confirm", response_model=FinancialEntryResponse)
async def confirm_financial_entry(
    entry_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(FinancialEntry).where(
            FinancialEntry.id == entry_id,
            FinancialEntry.business_id == current_user.business_id
        )
    )
    entry = result.scalar_one_or_none()

    if not entry:
        raise HTTPException(status_code=404, detail="Entry não encontrado")

    entry.confirmed = True
    await db.commit()
    await db.refresh(entry)

    return entry
