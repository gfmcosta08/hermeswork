from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List, Optional

from app.database import get_db
from app.models.models import Contact, User
from app.schemas.schemas import ContactCreate, ContactUpdate, ContactResponse
from app.core.deps import get_current_user

router = APIRouter(prefix="/contacts", tags=["contacts"])


@router.get("", response_model=List[ContactResponse])
async def list_contacts(
    type: Optional[str] = Query(None),
    active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Contact).where(Contact.business_id == current_user.business_id)

    if type:
        query = query.where(Contact.type == type)
    if active is not None:
        query = query.where(Contact.active == active)
    if search:
        query = query.where(
            Contact.name.ilike(f"%{search}%") |
            Contact.whatsapp_number.ilike(f"%{search}%")
        )

    result = await db.execute(query.order_by(Contact.last_seen.desc()))
    contacts = result.scalars().all()

    return contacts


@router.post("", response_model=ContactResponse)
async def create_contact(
    contact_data: ContactCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Contact).where(
            Contact.business_id == current_user.business_id,
            Contact.whatsapp_number == contact_data.whatsapp_number
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(status_code=400, detail="Contato já existe")

    contact = Contact(
        **contact_data.model_dump(),
        business_id=current_user.business_id
    )
    db.add(contact)
    await db.commit()
    await db.refresh(contact)

    return contact


@router.get("/{contact_id}", response_model=ContactResponse)
async def get_contact(
    contact_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Contact).where(
            Contact.id == contact_id,
            Contact.business_id == current_user.business_id
        )
    )
    contact = result.scalar_one_or_none()

    if not contact:
        raise HTTPException(status_code=404, detail="Contato não encontrado")

    return contact


@router.put("/{contact_id}", response_model=ContactResponse)
async def update_contact(
    contact_id: UUID,
    contact_data: ContactUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Contact).where(
            Contact.id == contact_id,
            Contact.business_id == current_user.business_id
        )
    )
    contact = result.scalar_one_or_none()

    if not contact:
        raise HTTPException(status_code=404, detail="Contato não encontrado")

    update_data = contact_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(contact, key, value)

    await db.commit()
    await db.refresh(contact)

    return contact


@router.delete("/{contact_id}")
async def delete_contact(
    contact_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Contact).where(
            Contact.id == contact_id,
            Contact.business_id == current_user.business_id
        )
    )
    contact = result.scalar_one_or_none()

    if not contact:
        raise HTTPException(status_code=404, detail="Contato não encontrado")

    contact.active = False
    await db.commit()

    return {"message": "Contato desativado"}
