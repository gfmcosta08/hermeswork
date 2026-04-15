import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Index, Text, Numeric, Integer, JSON, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Business(Base):
    __tablename__ = "business"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(50))
    segment: Mapped[str] = mapped_column(String(100), nullable=False)
    config: Mapped[dict] = mapped_column(JSON, default=dict)
    logo_url: Mapped[Optional[str]] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    contacts: Mapped[List["Contact"]] = relationship("Contact", back_populates="business")
    products: Mapped[List["Product"]] = relationship("Product", back_populates="business")
    inventory_items: Mapped[List["Inventory"]] = relationship("Inventory", back_populates="business")
    transactions: Mapped[List["Transaction"]] = relationship("Transaction", back_populates="business")
    suppliers: Mapped[List["Supplier"]] = relationship("Supplier", back_populates="business")
    partners: Mapped[List["Partner"]] = relationship("Partner", back_populates="business")
    financial_entries: Mapped[List["FinancialEntry"]] = relationship("FinancialEntry", back_populates="business")
    corretors: Mapped[List["Corretor"]] = relationship("Corretor", back_populates="business")
    expense_categories: Mapped[List["ExpenseCategory"]] = relationship("ExpenseCategory", back_populates="business")
    users: Mapped[List["User"]] = relationship("User", back_populates="business")
    quote_requests: Mapped[List["QuoteRequest"]] = relationship("QuoteRequest", back_populates="business")
    uazapi_config: Mapped[Optional["UazapiConfig"]] = relationship("UazapiConfig", back_populates="business", uselist=False)


class User(Base):
    __tablename__ = "user"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("business.id"), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[Optional[str]] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(50), default="gestor")
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    business: Mapped["Business"] = relationship("Business", back_populates="users")

    __table_args__ = (
        Index("idx_user_email", "email"),
    )


class Contact(Base):
    __tablename__ = "contact"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("business.id"), nullable=False)
    whatsapp_number: Mapped[str] = mapped_column(String(50), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[Optional[str]] = mapped_column(String(255))
    segment: Mapped[Optional[str]] = mapped_column(String(100))
    first_seen: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_seen: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    metadata: Mapped[dict] = mapped_column(JSON, default=dict)

    business: Mapped["Business"] = relationship("Business", back_populates="contacts")
    transactions: Mapped[List["Transaction"]] = relationship("Transaction", back_populates="customer")
    supplier: Mapped[Optional["Supplier"]] = relationship("Supplier", back_populates="contact", uselist=False)
    partner: Mapped[Optional["Partner"]] = relationship("Partner", back_populates="contact", uselist=False)
    corretor: Mapped[Optional["Corretor"]] = relationship("Corretor", back_populates="contact", uselist=False)
    quote_responses: Mapped[List["QuoteResponse"]] = relationship("QuoteResponse", back_populates="contact")

    __table_args__ = (
        Index("idx_contact_business", "business_id"),
        Index("idx_contact_whatsapp", "whatsapp_number"),
        Index("idx_contact_type", "type"),
    )


class Product(Base):
    __tablename__ = "product"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("business.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"))
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(100))
    unit: Mapped[Optional[str]] = mapped_column(String(50))
    description: Mapped[Optional[str]] = mapped_column(Text)
    has_inventory_link: Mapped[bool] = mapped_column(Boolean, default=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    images: Mapped[List] = mapped_column(JSON, default=list)
    metadata: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    business: Mapped["Business"] = relationship("Business", back_populates="products")
    components: Mapped[List["ProductComponent"]] = relationship("ProductComponent", back_populates="product")
    property_features: Mapped[List["PropertyFeature"]] = relationship("PropertyFeature", back_populates="product")
    transaction_items: Mapped[List["TransactionItem"]] = relationship("TransactionItem", back_populates="product")

    __table_args__ = (
        Index("idx_product_business", "business_id"),
        Index("idx_product_type", "type"),
    )


class ProductComponent(Base):
    __tablename__ = "product_component"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("product.id"), nullable=False)
    inventory_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("inventory.id"), nullable=False)
    quantity_needed: Mapped[Decimal] = mapped_column(Numeric(10, 3), nullable=False)
    cost_at_time: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    product: Mapped["Product"] = relationship("Product", back_populates="components")
    inventory: Mapped["Inventory"] = relationship("Inventory", back_populates="product_components")


class Inventory(Base):
    __tablename__ = "inventory"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("business.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    unit: Mapped[Optional[str]] = mapped_column(String(50))
    quantity: Mapped[Decimal] = mapped_column(Numeric(10, 3), default=Decimal("0"))
    purchase_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2))
    min_threshold: Mapped[Decimal] = mapped_column(Numeric(10, 3), default=Decimal("0"))
    location: Mapped[Optional[str]] = mapped_column(String(100))
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    business: Mapped["Business"] = relationship("Business", back_populates="inventory_items")
    movements: Mapped[List["InventoryMovement"]] = relationship("InventoryMovement", back_populates="inventory")
    product_components: Mapped[List["ProductComponent"]] = relationship("ProductComponent", back_populates="inventory")

    __table_args__ = (
        Index("idx_inventory_business", "business_id"),
    )


class InventoryMovement(Base):
    __tablename__ = "inventory_movement"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    inventory_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("inventory.id"), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(10, 3), nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(String(100))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    date_created: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    inventory: Mapped["Inventory"] = relationship("Inventory", back_populates="movements")


class Transaction(Base):
    __tablename__ = "transaction"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("business.id"), nullable=False)
    customer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("contact.id"), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pendente")
    date_created: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    date_scheduled: Mapped[Optional[datetime]] = mapped_column(DateTime)
    date_completed: Mapped[Optional[datetime]] = mapped_column(DateTime)
    metadata: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    business: Mapped["Business"] = relationship("Business", back_populates="transactions")
    customer: Mapped["Contact"] = relationship("Contact", back_populates="transactions")
    items: Mapped[List["TransactionItem"]] = relationship("TransactionItem", back_populates="transaction")
    financial_entries: Mapped[List["FinancialEntry"]] = relationship("FinancialEntry", back_populates="transaction")

    __table_args__ = (
        Index("idx_transaction_business", "business_id"),
        Index("idx_transaction_status", "status"),
        Index("idx_transaction_date", "date_created"),
    )


class TransactionItem(Base):
    __tablename__ = "transaction_item"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transaction_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("transaction.id"), nullable=False)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("product.id"), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(10, 3), default=Decimal("1"))
    price_at_time: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    transaction: Mapped["Transaction"] = relationship("Transaction", back_populates="items")
    product: Mapped["Product"] = relationship("Product", back_populates="transaction_items")


class Supplier(Base):
    __tablename__ = "supplier"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("business.id"), nullable=False)
    contact_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("contact.id"))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    whatsapp: Mapped[Optional[str]] = mapped_column(String(50))
    segment: Mapped[Optional[str]] = mapped_column(String(100))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    business: Mapped["Business"] = relationship("Business", back_populates="suppliers")
    contact: Mapped[Optional["Contact"]] = relationship("Contact", back_populates="supplier")


class Partner(Base):
    __tablename__ = "partner"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("business.id"), nullable=False)
    contact_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("contact.id"))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    whatsapp: Mapped[Optional[str]] = mapped_column(String(50))
    segment: Mapped[Optional[str]] = mapped_column(String(100))
    commission: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    business: Mapped["Business"] = relationship("Business", back_populates="partners")
    contact: Mapped[Optional["Contact"]] = relationship("Contact", back_populates="partner")


class QuoteRequest(Base):
    __tablename__ = "quote_request"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("business.id"), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="aguardando")
    date_created: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    deadline: Mapped[Optional[datetime]] = mapped_column(DateTime)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    business: Mapped["Business"] = relationship("Business", back_populates="quote_requests")
    responses: Mapped[List["QuoteResponse"]] = relationship("QuoteResponse", back_populates="quote_request")


class QuoteResponse(Base):
    __tablename__ = "quote_response"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quote_request_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("quote_request.id"), nullable=False)
    contact_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("contact.id"), nullable=False)
    price: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2))
    availability: Mapped[Optional[str]] = mapped_column(String(100))
    message: Mapped[Optional[str]] = mapped_column(Text)
    attachments: Mapped[List] = mapped_column(JSON, default=list)
    date_received: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    quote_request: Mapped["QuoteRequest"] = relationship("QuoteRequest", back_populates="responses")
    contact: Mapped["Contact"] = relationship("Contact", back_populates="quote_responses")


class FinancialEntry(Base):
    __tablename__ = "financial_entry"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("business.id"), nullable=False)
    transaction_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("transaction.id"))
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    category: Mapped[Optional[str]] = mapped_column(String(100))
    payment_method: Mapped[Optional[str]] = mapped_column(String(50))
    date_created: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    confirmed: Mapped[bool] = mapped_column(Boolean, default=False)
    installments: Mapped[bool] = mapped_column(Boolean, default=False)
    total_installments: Mapped[int] = mapped_column(Integer, default=1)
    installment_number: Mapped[int] = mapped_column(Integer, default=1)
    parent_entry_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("financial_entry.id"))
    due_date: Mapped[Optional[datetime]] = mapped_column(Date)
    paid_date: Mapped[Optional[datetime]] = mapped_column(Date)

    business: Mapped["Business"] = relationship("Business", back_populates="financial_entries")
    transaction: Mapped[Optional["Transaction"]] = relationship("Transaction", back_populates="financial_entries")
    parent_entry: Mapped[Optional["FinancialEntry"]] = relationship("FinancialEntry", remote_side=[id], back_populates="child_entries")
    child_entries: Mapped[List["FinancialEntry"]] = relationship("FinancialEntry", back_populates="parent_entry")

    __table_args__ = (
        Index("idx_financial_business", "business_id"),
        Index("idx_financial_date", "date_created"),
        Index("idx_financial_type", "type"),
    )


class Corretor(Base):
    __tablename__ = "corretor"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("business.id"), nullable=False)
    contact_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("contact.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    whatsapp: Mapped[Optional[str]] = mapped_column(String(50))
    commission_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0"))
    sales_count: Mapped[int] = mapped_column(Integer, default=0)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    business: Mapped["Business"] = relationship("Business", back_populates="corretors")
    contact: Mapped["Contact"] = relationship("Contact", back_populates="corretor")


class PropertyFeature(Base):
    __tablename__ = "property_feature"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("product.id"), nullable=False)
    key: Mapped[str] = mapped_column(String(100), nullable=False)
    value: Mapped[Optional[str]] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    product: Mapped["Product"] = relationship("Product", back_populates="property_features")


class ExpenseCategory(Base):
    __tablename__ = "expense_category"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("business.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    business: Mapped["Business"] = relationship("Business", back_populates="expense_categories")


class UazapiConfig(Base):
    __tablename__ = "uazapi_config"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("business.id"), unique=True, nullable=False)
    server_url: Mapped[str] = mapped_column(String(500), nullable=False)
    instance_token: Mapped[str] = mapped_column(String(255), nullable=False)
    webhook_url: Mapped[Optional[str]] = mapped_column(String(500))
    phone: Mapped[Optional[str]] = mapped_column(String(50))
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    business: Mapped["Business"] = relationship("Business", back_populates="uazapi_config")


class MessageQueue(Base):
    __tablename__ = "message_queue"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("business.id"), nullable=False)
    contact_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("contact.id"), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending")
    priority: Mapped[int] = mapped_column(Integer, default=0)
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    error_message: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_message_queue_status", "status"),
        Index("idx_message_queue_scheduled", "scheduled_at"),
    )
