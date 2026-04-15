from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from datetime import datetime
import json

from app.database import get_db, async_session_maker
from app.models.models import Business, Contact, UazapiConfig
from app.services.uazapi import UazapiService, MessageQueueService

router = APIRouter(prefix="/webhook", tags=["webhook"])


@router.post("/{business_id}")
async def receive_webhook(
    business_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    try:
        payload = await request.json()
    except Exception:
        return {"status": "error", "message": "Invalid JSON"}

    result = await db.execute(
        select(Business).where(Business.id == business_id)
    )
    business = result.scalar_one_or_none()

    if not business:
        return {"status": "error", "message": "Business not found"}

    event_type = payload.get("event", "")

    if event_type == "message" or "message" in payload:
        message_data = payload.get("message", payload)

        if isinstance(message_data, str):
            try:
                message_data = json.loads(message_data)
            except:
                pass

        remote_jid = message_data.get("remoteJid", "")
        from_me = message_data.get("fromMe", False)

        if from_me:
            return {"status": "ok"}

        phone = remote_jid.split("@")[0] if "@" in remote_jid else remote_jid
        text = message_data.get("text", {}).get("body", "") if isinstance(message_data.get("text"), dict) else message_data.get("text", "")

        if not text:
            return {"status": "ok"}

        result = await db.execute(
            select(Contact).where(
                Contact.business_id == business_id,
                Contact.whatsapp_number == phone
            )
        )
        contact = result.scalar_one_or_none()

        if not contact:
            contact = Contact(
                business_id=business_id,
                whatsapp_number=phone,
                type="cliente",
                name=phone
            )
            db.add(contact)
            await db.commit()
            await db.refresh(contact)

        contact.last_seen = datetime.utcnow()
        await db.commit()

        return {
            "status": "ok",
            "contact_id": str(contact.id),
            "message": text
        }

    if event_type == "connection":
        status = payload.get("state", "")
        return {"status": "ok", "connection_status": status}

    return {"status": "ok"}


@router.get("/{business_id}/status")
async def get_webhook_status(
    business_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(UazapiConfig).where(
            UazapiConfig.business_id == business_id,
            UazapiConfig.active == True
        )
    )
    config = result.scalar_one_or_none()

    if not config:
        return {
            "configured": False,
            "message": "uazapi não configurado"
        }

    uazapi = UazapiService(db, business_id)
    test_result = await uazapi.send_text(config.phone or "", "Teste de conexão")

    return {
        "configured": True,
        "server_url": config.server_url,
        "phone": config.phone,
        "test_result": test_result
    }
