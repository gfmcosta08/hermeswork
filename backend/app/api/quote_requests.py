from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List, Optional

from app.database import get_db
from app.models.models import QuoteRequest, QuoteResponse, User
from app.schemas.schemas import (
    QuoteRequestCreate, QuoteRequestResponse,
    QuoteResponseCreate, QuoteResponseResponse
)
from app.core.deps import get_current_user

router = APIRouter(prefix="/quote-requests", tags=["quote-requests"])


@router.get("", response_model=List[QuoteRequestResponse])
async def list_quote_requests(
    status: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(QuoteRequest).where(QuoteRequest.business_id == current_user.business_id)

    if status:
        query = query.where(QuoteRequest.status == status)
    if type:
        query = query.where(QuoteRequest.type == type)

    result = await db.execute(query.order_by(QuoteRequest.date_created.desc()))
    requests = result.scalars().all()

    return requests


@router.post("", response_model=QuoteRequestResponse)
async def create_quote_request(
    request_data: QuoteRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    quote_request = QuoteRequest(
        **request_data.model_dump(),
        business_id=current_user.business_id
    )
    db.add(quote_request)
    await db.commit()
    await db.refresh(quote_request)

    return quote_request


@router.get("/{request_id}", response_model=QuoteRequestResponse)
async def get_quote_request(
    request_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(QuoteRequest).where(
            QuoteRequest.id == request_id,
            QuoteRequest.business_id == current_user.business_id
        )
    )
    quote_request = result.scalar_one_or_none()

    if not quote_request:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")

    return quote_request


@router.get("/{request_id}/responses", response_model=List[QuoteResponseResponse])
async def list_quote_responses(
    request_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(QuoteRequest).where(
            QuoteRequest.id == request_id,
            QuoteRequest.business_id == current_user.business_id
        )
    )
    quote_request = result.scalar_one_or_none()
    if not quote_request:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")

    result = await db.execute(
        select(QuoteResponse).where(QuoteResponse.quote_request_id == request_id)
    )
    responses = result.scalars().all()

    return responses


@router.post("/{request_id}/responses", response_model=QuoteResponseResponse)
async def create_quote_response(
    request_id: UUID,
    response_data: QuoteResponseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(QuoteRequest).where(
            QuoteRequest.id == request_id,
            QuoteRequest.business_id == current_user.business_id
        )
    )
    quote_request = result.scalar_one_or_none()
    if not quote_request:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")

    response = QuoteResponse(
        **response_data.model_dump(),
        quote_request_id=request_id
    )
    db.add(response)

    quote_request.status = "parcial"
    await db.commit()
    await db.refresh(response)

    return response
