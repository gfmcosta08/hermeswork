from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.database import engine, Base
from app.api import auth, business, contacts, products, inventory, transactions, financial
from app.api import suppliers, partners, quote_requests, corretors, expense_categories
from app.api import uazapi, webhook, search, upload


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="FarollWork API",
    description="Sistema de gestão empresarial via WhatsApp",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(auth.router, prefix="/api/v1")
app.include_router(business.router, prefix="/api/v1")
app.include_router(contacts.router, prefix="/api/v1")
app.include_router(products.router, prefix="/api/v1")
app.include_router(inventory.router, prefix="/api/v1")
app.include_router(transactions.router, prefix="/api/v1")
app.include_router(financial.router, prefix="/api/v1")
app.include_router(suppliers.router, prefix="/api/v1")
app.include_router(partners.router, prefix="/api/v1")
app.include_router(quote_requests.router, prefix="/api/v1")
app.include_router(corretors.router, prefix="/api/v1")
app.include_router(expense_categories.router, prefix="/api/v1")
app.include_router(uazapi.router, prefix="/api/v1")
app.include_router(webhook.router, prefix="/fw")
app.include_router(search.router, prefix="/api/v1")
app.include_router(upload.router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "farollwork-api"}


@app.get("/")
async def root():
    return {"message": "FarollWork API", "version": "1.0.0"}
