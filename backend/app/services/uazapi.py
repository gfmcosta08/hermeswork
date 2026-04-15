import httpx
import asyncio
from typing import List, Optional
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.models import UazapiConfig, Contact, Business, MessageQueue
from app.database import async_session_maker


class UazapiService:
    def __init__(self, db: AsyncSession, business_id: UUID):
        self.db = db
        self.business_id = business_id
        self.config: Optional[UazapiConfig] = None

    async def get_config(self) -> Optional[UazapiConfig]:
        if self.config is None:
            result = await self.db.execute(
                select(UazapiConfig).where(
                    UazapiConfig.business_id == self.business_id,
                    UazapiConfig.active == True
                )
            )
            self.config = result.scalar_one_or_none()
        return self.config

    async def send_text(self, number: str, text: str) -> dict:
        config = await self.get_config()
        if not config:
            return {"success": False, "error": "uazapi não configurado"}

        url = f"{config.server_url}/sendText"
        headers = {"token": config.instance_token}
        payload = {
            "number": self._format_number(number),
            "text": text
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                return {"success": True, "data": response.json()}
        except httpx.HTTPStatusError as e:
            return {"success": False, "error": f"HTTP error: {e.response.status_code}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def send_image(self, number: str, image_url: str, caption: Optional[str] = None) -> dict:
        config = await self.get_config()
        if not config:
            return {"success": False, "error": "uazapi não configurado"}

        url = f"{config.server_url}/sendImage"
        headers = {"token": config.instance_token}
        payload = {
            "number": self._format_number(number),
            "image": image_url,
        }
        if caption:
            payload["caption"] = caption

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                return {"success": True, "data": response.json()}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def send_file(self, number: str, file_url: str, filename: str) -> dict:
        config = await self.get_config()
        if not config:
            return {"success": False, "error": "uazapi não configurado"}

        url = f"{config.server_url}/sendFile"
        headers = {"token": config.instance_token}
        payload = {
            "number": self._format_number(number),
            "file": file_url,
            "filename": filename
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                return {"success": True, "data": response.json()}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def _format_number(self, number: str) -> str:
        digits = ''.join(filter(str.isdigit, number))
        if digits.startswith('55'):
            return digits
        return f"55{digits}"


class MessageQueueService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.current_interval = settings.UAZAPI_INITIAL_INTERVAL
        self.max_batch_size = settings.UAZAPI_MAX_BATCH_SIZE

    async def add_to_queue(
        self,
        business_id: UUID,
        contact_id: UUID,
        message: str,
        priority: int = 0
    ) -> MessageQueue:
        queue_item = MessageQueue(
            business_id=business_id,
            contact_id=contact_id,
            message=message,
            priority=priority,
            status="pending"
        )
        self.db.add(queue_item)
        await self.db.commit()
        await self.db.refresh(queue_item)
        return queue_item

    async def get_pending_messages(self, business_id: UUID, limit: int = None) -> List[MessageQueue]:
        if limit is None:
            limit = self.max_batch_size

        result = await self.db.execute(
            select(MessageQueue)
            .where(
                MessageQueue.business_id == business_id,
                MessageQueue.status == "pending"
            )
            .order_by(MessageQueue.priority.desc(), MessageQueue.created_at)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def mark_sent(self, message_id: UUID) -> None:
        from datetime import datetime
        result = await self.db.execute(select(MessageQueue).where(MessageQueue.id == message_id))
        item = result.scalar_one_or_none()
        if item:
            item.status = "sent"
            item.sent_at = datetime.utcnow()
            await self.db.commit()

    async def mark_failed(self, message_id: UUID, error: str) -> None:
        result = await self.db.execute(select(MessageQueue).where(MessageQueue.id == message_id))
        item = result.scalar_one_or_none()
        if item:
            item.status = "failed"
            item.error_message = error
            await self.db.commit()

    def increase_interval(self) -> int:
        self.current_interval = min(
            self.current_interval + 5,
            settings.UAZAPI_MAX_INTERVAL
        )
        return self.current_interval

    def decrease_interval(self) -> int:
        self.current_interval = max(
            self.current_interval - 5,
            settings.UAZAPI_INITIAL_INTERVAL
        )
        return self.current_interval


async def process_message_queue(business_id: UUID) -> dict:
    async with async_session_maker() as db:
        uazapi = UazapiService(db, business_id)
        queue_service = MessageQueueService(db)

        pending = await queue_service.get_pending_messages(business_id)
        if not pending:
            return {"processed": 0, "failed": 0}

        results = {"processed": 0, "failed": 0}

        for msg in pending:
            result = await uazapi.send_text(
                number=msg.contact_id,
                message=msg.message
            )

            if result["success"]:
                await queue_service.mark_sent(msg.id)
                results["processed"] += 1
                queue_service.decrease_interval()
            else:
                await queue_service.mark_failed(msg.id, result.get("error", "Unknown error"))
                results["failed"] += 1
                queue_service.increase_interval()

            await asyncio.sleep(queue_service.current_interval)

        return results
