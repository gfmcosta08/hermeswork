from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID


class TokenData(BaseModel):
    user_id: UUID
    business_id: UUID
    role: str


class PasswordRecoveryRequest(BaseModel):
    email: EmailStr


class PasswordResetRequest(BaseModel):
    token: str
    new_password: str
