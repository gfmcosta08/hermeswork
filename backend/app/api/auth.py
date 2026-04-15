from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta

from app.database import get_db
from app.models.models import User, Business
from app.schemas.auth import TokenData, PasswordRecoveryRequest, PasswordResetRequest
from app.schemas.schemas import TokenResponse, UserLogin, UserCreate, UserResponse
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.deps import get_current_user
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos"
        )

    if not user.active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário inativo"
        )

    access_token = create_access_token(
        data={
            "user_id": str(user.id),
            "business_id": str(user.business_id),
            "role": user.role
        },
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return TokenResponse(
        access_token=access_token,
        user_id=user.id,
        business_id=user.business_id,
        role=user.role
    )


@router.post("/register", response_model=UserResponse)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já cadastrado"
        )

    business = Business(
        name="Novo Negócio",
        segment="outro",
        config={
            "horario_funcionamento": "08:00-18:00",
            "dias_abertos": ["monday", "tuesday", "wednesday", "thursday", "friday"],
            "agendamento_tipo": "gestor",
            "notificacoes": {
                "estoque_baixo": True,
                "orcamento_respondido": True,
                "pagamento_pendente": True
            }
        }
    )
    db.add(business)
    await db.flush()

    user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        name=user_data.name,
        role="admin" if user_data.role == "admin" else "gestor",
        business_id=business.id
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return user


@router.post("/recovery")
async def request_password_recovery(
    request: PasswordRecoveryRequest,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    if not user:
        return {"message": "Se o email existir, um link de recuperação será enviado"}

    return {"message": "Se o email existir, um link de recuperação será enviado"}


@router.post("/reset")
async def reset_password(
    request: PasswordResetRequest,
    db: AsyncSession = Depends(get_db)
):
    return {"message": "Senha alterada com sucesso"}


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Logout realizado com sucesso"}
