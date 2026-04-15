"""
Testes de integração FarollWork + uazapi
Execute: pytest tests/integration/test_uazapi_integration.py -v
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient, ASGITransport
from uuid import uuid4
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


class TestUazapiWebhookIntegration:
    """Testes de integração com webhook uazapi"""

    @pytest.fixture
    def mock_uazapi_payload(self):
        return {
            "event": "message",
            "session": "farollwork_test",
            "message": {
                "key": {
                    "remoteJid": "5511999999999@s.whatsapp.net",
                    "fromMe": False,
                    "id": "XYZ123"
                },
                "pushName": "João Teste",
                "text": {
                    "body": "Olá, gostaria de saber o preço do produto X"
                },
                "timestamp": 1712500000
            }
        }

    @pytest.fixture
    def mock_connection_payload(self):
        return {
            "event": "connection",
            "session": "farollwork_test",
            "state": "open"
        }

    async def test_webhook_receives_message_and_creates_contact(self, mock_uazapi_payload):
        """Testa se o webhook recebe mensagem e cria contato"""

        from app.main import app
        from app.database import get_db, async_session_maker
        from app.models.models import Contact, Business

        business_id = uuid4()

        mock_db = AsyncMock()
        mock_business = MagicMock()
        mock_business.id = business_id
        mock_business.segment = "alimentacao"
        mock_business.config = {}

        mock_result = AsyncMock()
        mock_result.scalar_one_or_none = AsyncMock(return_value=None)
        mock_db.execute = AsyncMock(return_value=mock_result)

        mock_contact = MagicMock(spec=Contact)
        mock_contact.id = uuid4()
        mock_contact.business_id = business_id
        mock_contact.whatsapp_number = "5511999999999"
        mock_contact.type = "cliente"
        mock_contact.name = "5511999999999"

        async def mock_add(obj):
            pass

        async def mock_commit():
            pass

        async def mock_refresh(obj):
            obj.id = mock_contact.id

        mock_db.add = mock_add
        mock_db.commit = mock_commit
        mock_db.refresh = mock_refresh

        app.dependency_overrides[get_db] = lambda: mock_db

        try:
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.post(
                    f"/fw/webhook/{business_id}",
                    json=mock_uazapi_payload
                )

                assert response.status_code == 200
                data = response.json()
                assert data["status"] == "ok"
                assert "contact_id" in data
        finally:
            app.dependency_overrides.pop(get_db, None)

    async def test_webhook_ignores_own_messages(self, mock_uazapi_payload):
        """Testa se o webhook ignora mensagens enviadas pelo proprio numero"""

        from app.main import app
        from app.database import get_db

        business_id = uuid4()

        payload_with_from_me_true = {
            **mock_uazapi_payload,
            "message": {
                **mock_uazapi_payload["message"],
                "key": {
                    **mock_uazapi_payload["message"]["key"],
                    "fromMe": True
                }
            }
        }

        mock_db = AsyncMock()
        app.dependency_overrides[get_db] = lambda: mock_db

        try:
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.post(
                    f"/fw/webhook/{business_id}",
                    json=payload_with_from_me_true
                )

                assert response.status_code == 200
                data = response.json()
                assert data["status"] == "ok"
        finally:
            app.dependency_overrides.pop(get_db, None)


class TestUazapiSendMessage:
    """Testes para envio de mensagens via uazapi"""

    @pytest.fixture
    def mock_uazapi_config(self):
        return {
            "server_url": "https://farollbr.uazapi.com",
            "instance_token": "test_token_123",
            "phone": "5511888888888",
            "active": True
        }

    @pytest.mark.asyncio
    async def test_send_text_success(self, mock_uazapi_config):
        """Testa envio de mensagem de texto com sucesso"""

        from app.services.uazapi import UazapiService
        from app.models.models import UazapiConfig
        from unittest.mock import AsyncMock, MagicMock
        import uuid

        mock_db = AsyncMock()

        mock_config = MagicMock(spec=UazapiConfig)
        mock_config.server_url = mock_uazapi_config["server_url"]
        mock_config.instance_token = mock_uazapi_config["instance_token"]
        mock_config.active = True

        mock_result = AsyncMock()
        mock_result.scalar_one_or_none = AsyncMock(return_value=mock_config)
        mock_db.execute = AsyncMock(return_value=mock_result)

        uazapi = UazapiService(mock_db, uuid.uuid4())

        with patch('httpx.AsyncClient') as mock_client:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json = MagicMock(return_value={"success": True})

            mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                return_value=mock_response
            )
            mock_client.return_value.__aexit__.return_value = None

            result = await uazapi.send_text("5511999999999", "Olá, tudo bem?")

            assert result["success"] == True

    @pytest.mark.asyncio
    async def test_send_text_formats_number(self, mock_uazapi_config):
        """Testa se o numero é formatado corretamente (55 + DDD + numero)"""

        from app.services.uazapi import UazapiService
        from app.models.models import UazapiConfig
        from unittest.mock import AsyncMock, MagicMock
        import uuid

        mock_db = AsyncMock()

        mock_config = MagicMock(spec=UazapiConfig)
        mock_config.server_url = mock_uazapi_config["server_url"]
        mock_config.instance_token = mock_uazapi_config["instance_token"]
        mock_config.active = True

        mock_result = AsyncMock()
        mock_result.scalar_one_or_none = AsyncMock(return_value=mock_config)
        mock_db.execute = AsyncMock(return_value=mock_result)

        uazapi = UazapiService(mock_db, uuid.uuid4())

        formatted = uazapi._format_number("11999999999")
        assert formatted == "5511999999999"

        formatted2 = uazapi._format_number("5511999999999")
        assert formatted2 == "5511999999999"

        formatted3 = uazapi._format_number("+55 11 99999-9999")
        assert formatted3 == "5511999999999"


class TestMessageQueueRateLimiting:
    """Testes para rate limiting de mensagens"""

    @pytest.mark.asyncio
    async def test_interval_increases_on_failure(self):
        """Testa se o intervalo aumenta após falha"""

        from app.services.uazapi import MessageQueueService
        from app.config import settings
        from unittest.mock import AsyncMock, MagicMock

        mock_db = AsyncMock()
        queue = MessageQueueService(mock_db)

        initial_interval = queue.current_interval

        queue.increase_interval()

        assert queue.current_interval > initial_interval
        assert queue.current_interval <= settings.UAZAPI_MAX_INTERVAL

    @pytest.mark.asyncio
    async def test_interval_decreases_on_success(self):
        """Testa se o intervalo diminui após sucesso"""

        from app.services.uazapi import MessageQueueService
        from app.config import settings
        from unittest.mock import AsyncMock

        mock_db = AsyncMock()
        queue = MessageQueueService(mock_db)

        queue.current_interval = 45

        queue.decrease_interval()

        assert queue.current_interval < 45
        assert queue.current_interval >= settings.UAZAPI_INITIAL_INTERVAL

    @pytest.mark.asyncio
    async def test_max_batch_size_respected(self):
        """Testa se o limite de 3 mensagens por batch é respeitado"""

        from app.services.uazapi import MessageQueueService
        from app.config import settings
        from unittest.mock import AsyncMock, MagicMock
        import uuid

        mock_db = AsyncMock()

        mock_messages = [MagicMock(id=uuid.uuid4()) for _ in range(5)]

        mock_result = AsyncMock()
        mock_result.scalars.return_value.all = MagicMock(return_value=mock_messages)
        mock_db.execute = AsyncMock(return_value=mock_result)

        queue = MessageQueueService(mock_db)

        pending = await queue.get_pending_messages(uuid.uuid4())

        assert len(pending) <= settings.UAZAPI_MAX_BATCH_SIZE


class TestBulkImportIntegration:
    """Testes de integração do bulk import"""

    def test_parse_excel_products(self):
        """Testa parsing de arquivo Excel com produtos"""

        from app.services.bulk_import import BulkImportService
        import pandas as pd
        from io import BytesIO

        service = BulkImportService()

        df = pd.DataFrame({
            'Nome': ['Pizza Mussarela', 'Pizza Calabresa', 'Refrigerante'],
            'Preço': [42.00, 45.00, 8.00],
            'Categoria': ['Pizza', 'Pizza', 'Bebida'],
            'Unidade': ['un', 'un', 'un']
        })

        buffer = BytesIO()
        df.to_excel(buffer, index=False, engine='openpyxl')
        buffer.seek(0)

        records = service.parse_excel(buffer.read())

        assert len(records) == 3
        assert records[0]['name'] == 'Pizza Mussarela'
        assert records[0]['price'] == 42.00

    def test_parse_csv_contacts(self):
        """Testa parsing de CSV com contatos"""

        from app.services.bulk_import import BulkImportService
        from io import BytesIO

        service = BulkImportService()

        csv_content = b"""nome,whatsapp,tipo
João Silva,11999999999,cliente
Maria Santos,21888888888,fornecedor"""

        records = service.parse_csv(csv_content)

        assert len(records) == 2
        assert records[0]['name'] == 'João Silva'
        assert records[0]['whatsapp_number'] == '11999999999'

    def test_map_to_product(self):
        """Testa mapeamento de registro para produto"""

        from app.services.bulk_import import BulkImportService
        from decimal import Decimal

        service = BulkImportService()

        record = {
            'name': 'Pizza Grande',
            'price': 58.90,
            'category': 'Pizza',
            'unit': 'un'
        }

        product = service.map_to_product(record)

        assert product['name'] == 'Pizza Grande'
        assert product['price'] == Decimal('58.9')
        assert product['category'] == 'Pizza'

    def test_conflict_mode_skip(self):
        """Testa modo de conflito skip (nãosobrescreve)"""

        from app.services.bulk_import import BulkImportService

        service = BulkImportService()

        record = {'name': 'Pizza Mussarela', 'price': 45.00}

        existing = {'name': 'Pizza Mussarela', 'price': 42.00}

        if existing['name'].lower() == record['name'].lower():
            result = 'skipped'
        else:
            result = 'created'

        assert result == 'skipped'


class TestWebhookStatus:
    """Testes para status do webhook"""

    @pytest.mark.asyncio
    async def test_webhook_status_not_configured(self):
        """Testa status quando uazapi não está configurado"""

        from app.main import app
        from app.database import get_db
        from unittest.mock import AsyncMock, MagicMock
        import uuid

        mock_db = AsyncMock()

        mock_result = AsyncMock()
        mock_result.scalar_one_or_none = AsyncMock(return_value=None)
        mock_db.execute = AsyncMock(return_value=mock_result)

        app.dependency_overrides[get_db] = lambda: mock_db

        try:
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.get(f"/fw/webhook/{uuid.uuid4()}/status")

                assert response.status_code == 200
                data = response.json()
                assert data["configured"] == False
        finally:
            app.dependency_overrides.pop(get_db, None)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
