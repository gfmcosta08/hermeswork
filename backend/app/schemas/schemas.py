from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime, date
from decimal import Decimal


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: UUID
    business_id: UUID
    role: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None
    role: str = "gestor"


class UserResponse(BaseModel):
    id: UUID
    email: str
    name: Optional[str]
    role: str
    business_id: UUID
    active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class BusinessCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    segment: str
    config: Optional[dict] = {}
    logo_url: Optional[str] = None


class BusinessUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    segment: Optional[str] = None
    config: Optional[dict] = None
    logo_url: Optional[str] = None


class BusinessResponse(BaseModel):
    id: UUID
    name: str
    phone: Optional[str]
    segment: str
    config: dict
    logo_url: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ContactCreate(BaseModel):
    whatsapp_number: str
    type: str
    name: Optional[str] = None
    segment: Optional[str] = None
    notes: Optional[str] = None
    metadata: Optional[dict] = {}


class ContactUpdate(BaseModel):
    whatsapp_number: Optional[str] = None
    type: Optional[str] = None
    name: Optional[str] = None
    segment: Optional[str] = None
    notes: Optional[str] = None
    metadata: Optional[dict] = None
    active: Optional[bool] = None


class ContactResponse(BaseModel):
    id: UUID
    business_id: UUID
    whatsapp_number: str
    type: str
    name: Optional[str]
    segment: Optional[str]
    first_seen: datetime
    last_seen: datetime
    notes: Optional[str]
    active: bool
    metadata: dict

    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    name: str
    price: Decimal = Decimal("0")
    type: str
    category: Optional[str] = None
    unit: Optional[str] = None
    description: Optional[str] = None
    has_inventory_link: bool = False
    images: Optional[List[str]] = []
    metadata: Optional[dict] = {}


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[Decimal] = None
    type: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    description: Optional[str] = None
    has_inventory_link: Optional[bool] = None
    active: Optional[bool] = None
    images: Optional[List[str]] = None
    metadata: Optional[dict] = None


class ProductResponse(BaseModel):
    id: UUID
    business_id: UUID
    name: str
    price: Decimal
    type: str
    category: Optional[str]
    unit: Optional[str]
    description: Optional[str]
    has_inventory_link: bool
    active: bool
    images: List[str]
    metadata: dict
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProductComponentCreate(BaseModel):
    product_id: UUID
    inventory_id: UUID
    quantity_needed: Decimal
    cost_at_time: Decimal = Decimal("0")


class ProductComponentResponse(BaseModel):
    id: UUID
    product_id: UUID
    inventory_id: UUID
    quantity_needed: Decimal
    cost_at_time: Decimal
    created_at: datetime

    class Config:
        from_attributes = True


class InventoryCreate(BaseModel):
    name: str
    unit: Optional[str] = None
    quantity: Decimal = Decimal("0")
    purchase_price: Optional[Decimal] = None
    min_threshold: Decimal = Decimal("0")
    location: Optional[str] = None


class InventoryUpdate(BaseModel):
    name: Optional[str] = None
    unit: Optional[str] = None
    quantity: Optional[Decimal] = None
    purchase_price: Optional[Decimal] = None
    min_threshold: Optional[Decimal] = None
    location: Optional[str] = None
    active: Optional[bool] = None


class InventoryResponse(BaseModel):
    id: UUID
    business_id: UUID
    name: str
    unit: Optional[str]
    quantity: Decimal
    purchase_price: Optional[Decimal]
    min_threshold: Decimal
    location: Optional[str]
    active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InventoryMovementCreate(BaseModel):
    inventory_id: UUID
    type: str
    quantity: Decimal
    reason: Optional[str] = None
    notes: Optional[str] = None


class InventoryMovementResponse(BaseModel):
    id: UUID
    inventory_id: UUID
    type: str
    quantity: Decimal
    reason: Optional[str]
    notes: Optional[str]
    date_created: datetime

    class Config:
        from_attributes = True


class TransactionCreate(BaseModel):
    customer_id: UUID
    type: str
    date_scheduled: Optional[datetime] = None
    metadata: Optional[dict] = {}


class TransactionUpdate(BaseModel):
    status: Optional[str] = None
    date_scheduled: Optional[datetime] = None
    date_completed: Optional[datetime] = None
    metadata: Optional[dict] = None


class TransactionResponse(BaseModel):
    id: UUID
    business_id: UUID
    customer_id: UUID
    type: str
    status: str
    date_created: datetime
    date_scheduled: Optional[datetime]
    date_completed: Optional[datetime]
    metadata: dict
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TransactionItemCreate(BaseModel):
    product_id: UUID
    quantity: Decimal = Decimal("1")
    price_at_time: Decimal


class TransactionItemResponse(BaseModel):
    id: UUID
    transaction_id: UUID
    product_id: UUID
    quantity: Decimal
    price_at_time: Decimal
    created_at: datetime

    class Config:
        from_attributes = True


class SupplierCreate(BaseModel):
    contact_id: Optional[UUID] = None
    name: str
    whatsapp: Optional[str] = None
    segment: Optional[str] = None
    notes: Optional[str] = None


class SupplierUpdate(BaseModel):
    contact_id: Optional[UUID] = None
    name: Optional[str] = None
    whatsapp: Optional[str] = None
    segment: Optional[str] = None
    notes: Optional[str] = None
    active: Optional[bool] = None


class SupplierResponse(BaseModel):
    id: UUID
    business_id: UUID
    contact_id: Optional[UUID]
    name: str
    whatsapp: Optional[str]
    segment: Optional[str]
    notes: Optional[str]
    active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PartnerCreate(BaseModel):
    contact_id: Optional[UUID] = None
    name: str
    whatsapp: Optional[str] = None
    segment: Optional[str] = None
    commission: Optional[Decimal] = None
    notes: Optional[str] = None


class PartnerUpdate(BaseModel):
    contact_id: Optional[UUID] = None
    name: Optional[str] = None
    whatsapp: Optional[str] = None
    segment: Optional[str] = None
    commission: Optional[Decimal] = None
    notes: Optional[str] = None
    active: Optional[bool] = None


class PartnerResponse(BaseModel):
    id: UUID
    business_id: UUID
    contact_id: Optional[UUID]
    name: str
    whatsapp: Optional[str]
    segment: Optional[str]
    commission: Optional[Decimal]
    notes: Optional[str]
    active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class QuoteRequestCreate(BaseModel):
    type: str
    description: str
    deadline: Optional[datetime] = None


class QuoteRequestResponse(BaseModel):
    id: UUID
    business_id: UUID
    type: str
    description: str
    status: str
    date_created: datetime
    deadline: Optional[datetime]
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class QuoteResponseCreate(BaseModel):
    quote_request_id: UUID
    contact_id: UUID
    price: Optional[Decimal] = None
    availability: Optional[str] = None
    message: Optional[str] = None
    attachments: Optional[List[str]] = []


class QuoteResponseResponse(BaseModel):
    id: UUID
    quote_request_id: UUID
    contact_id: UUID
    price: Optional[Decimal]
    availability: Optional[str]
    message: Optional[str]
    attachments: List[str]
    date_received: datetime

    class Config:
        from_attributes = True


class FinancialEntryCreate(BaseModel):
    transaction_id: Optional[UUID] = None
    type: str
    amount: Decimal
    description: Optional[str] = None
    category: Optional[str] = None
    payment_method: Optional[str] = None
    confirmed: bool = False
    installments: bool = False
    total_installments: int = 1
    installment_number: int = 1
    parent_entry_id: Optional[UUID] = None
    due_date: Optional[date] = None
    paid_date: Optional[date] = None


class FinancialEntryResponse(BaseModel):
    id: UUID
    business_id: UUID
    transaction_id: Optional[UUID]
    type: str
    amount: Decimal
    description: Optional[str]
    category: Optional[str]
    payment_method: Optional[str]
    date_created: datetime
    confirmed: bool
    installments: bool
    total_installments: int
    installment_number: int
    parent_entry_id: Optional[UUID]
    due_date: Optional[date]
    paid_date: Optional[date]

    class Config:
        from_attributes = True


class CorretorCreate(BaseModel):
    contact_id: UUID
    name: str
    whatsapp: Optional[str] = None
    commission_rate: Decimal = Decimal("0")


class CorretorUpdate(BaseModel):
    contact_id: Optional[UUID] = None
    name: Optional[str] = None
    whatsapp: Optional[str] = None
    commission_rate: Optional[Decimal] = None
    active: Optional[bool] = None


class CorretorResponse(BaseModel):
    id: UUID
    business_id: UUID
    contact_id: UUID
    name: str
    whatsapp: Optional[str]
    commission_rate: Decimal
    sales_count: int
    active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PropertyFeatureCreate(BaseModel):
    product_id: UUID
    key: str
    value: Optional[str] = None


class PropertyFeatureResponse(BaseModel):
    id: UUID
    product_id: UUID
    key: str
    value: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ExpenseCategoryCreate(BaseModel):
    name: str
    type: str


class ExpenseCategoryUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    active: Optional[bool] = None


class ExpenseCategoryResponse(BaseModel):
    id: UUID
    business_id: UUID
    name: str
    type: str
    active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UazapiConfigCreate(BaseModel):
    server_url: str
    instance_token: str
    webhook_url: Optional[str] = None
    phone: Optional[str] = None


class UazapiConfigUpdate(BaseModel):
    server_url: Optional[str] = None
    instance_token: Optional[str] = None
    webhook_url: Optional[str] = None
    phone: Optional[str] = None
    active: Optional[bool] = None


class UazapiConfigResponse(BaseModel):
    id: UUID
    business_id: UUID
    server_url: str
    instance_token: str
    webhook_url: Optional[str]
    phone: Optional[str]
    active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FinancialReportRequest(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    type: Optional[str] = None
    category: Optional[str] = None


class FinancialReportResponse(BaseModel):
    total_receitas: Decimal
    total_despesas: Decimal
    saldo: Decimal
    por_categoria: dict
    por_metodo: dict
    entradas: List[FinancialEntryResponse]
    saidas: List[FinancialEntryResponse]
