from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.database import get_db
from app.models.models import UazapiConfig, User
from app.schemas.schemas import UazapiConfigCreate, UazapiConfigUpdate, UazapiConfigResponse
from app.core.deps import get_current_user

router = APIRouter(prefix="/uazapi", tags=["uazapi"])


@router.get("/config", response_model=UazapiConfigResponse)
async def get_uazapi_config(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(UazapiConfig).where(
            UazapiConfig.business_id == current_user.business_id
        )
    )
    config = result.scalar_one_or_none()

    if not config:
        raise HTTPException(status_code=404, detail="Configuração não encontrada")

    return config


@router.post("/config", response_model=UazapiConfigResponse)
async def create_or_update_uazapi_config(
    config_data: UazapiConfigCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(UazapiConfig).where(
            UazapiConfig.business_id == current_user.business_id
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        update_data = config_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(existing, key, value)
        await db.commit()
        await db.refresh(existing)
        return existing

    config = UazapiConfig(
        **config_data.model_dump(),
        business_id=current_user.business_id
    )
    db.add(config)
    await db.commit()
    await db.refresh(config)

    return config
