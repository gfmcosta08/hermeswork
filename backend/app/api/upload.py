from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List, Optional
import aiofiles
import os
import uuid
from datetime import datetime
import json

from app.database import get_db
from app.models.models import Product, Inventory, Contact, User
from app.schemas.schemas import ProductCreate, InventoryCreate, ContactCreate
from app.core.deps import get_current_user
from app.services.bulk_import import BulkImportService

router = APIRouter(prefix="/upload", tags=["upload"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Arquivo deve ser uma imagem")

    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Arquivo deve ter no máximo 10MB")

    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    async with aiofiles.open(filepath, "wb") as f:
        content = await file.read()
        await f.write(content)

    return {
        "url": f"/uploads/{filename}",
        "filename": filename
    }


@router.post("/product-images/{product_id}")
async def upload_product_images(
    product_id: UUID,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Product).where(
            Product.id == product_id,
            Product.business_id == current_user.business_id
        )
    )
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    urls = []
    for file in files:
        if not file.content_type.startswith("image/"):
            continue

        ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        filename = f"{uuid.uuid4()}.{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)

        async with aiofiles.open(filepath, "wb") as f:
            content = await file.read()
            await f.write(content)

        url = f"/uploads/{filename}"
        urls.append(url)

        if product.images is None:
            product.images = []
        product.images.append(url)

    await db.commit()

    return {"urls": urls}


@router.post("/bulk/preview")
async def bulk_import_preview(
    file: UploadFile = File(...),
    import_type: str = Form("products"),
    current_user: User = Depends(get_current_user)
):
    content = await file.read()
    service = BulkImportService()

    try:
        preview = service.preview_import(content, file.filename, import_type)
        return preview
    except Exception as e:
        return {"error": str(e)}


@router.post("/bulk")
async def bulk_import(
    file: UploadFile = File(...),
    import_type: str = Form("products"),
    conflict_mode: str = Form("skip"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    content = await file.read()
    service = BulkImportService()

    ext = file.filename.lower().split('.')[-1]

    try:
        if ext in ['xlsx', 'xls', 'csv']:
            records = service.parse_csv(content) if ext == 'csv' else service.parse_excel(content)
        elif ext == 'json':
            records = service.parse_json(content)
        else:
            return {"error": f"Formato não suportado: {ext}"}
    except Exception as e:
        return {"error": f"Erro ao processar arquivo: {str(e)}"}

    results = {
        "created": 0,
        "updated": 0,
        "errors": 0,
        "items": [],
        "error_details": []
    }

    for idx, record in enumerate(records):
        try:
            if import_type == "products":
                item = service.map_to_product(record)
                if not item:
                    results["errors"] += 1
                    results["error_details"].append(f"Linha {idx + 1}: Nome não encontrado")
                    continue

                existing = await db.execute(
                    select(Product).where(
                        Product.business_id == current_user.business_id,
                        Product.name.ilike(item['name'])
                    )
                )
                existing_product = existing.scalar_one_or_none()

                if existing_product:
                    if conflict_mode == "update":
                        for key, value in item.items():
                            if key != 'name':
                                setattr(existing_product, key, value)
                        results["updated"] += 1
                        results["items"].append({"action": "updated", "name": item['name']})
                    else:
                        results["items"].append({"action": "skipped", "name": item['name']})
                else:
                    product = Product(
                        business_id=current_user.business_id,
                        **{k: v for k, v in item.items() if k != 'metadata'},
                        metadata=item.get('metadata', {})
                    )
                    db.add(product)
                    results["created"] += 1
                    results["items"].append({"action": "created", "name": item['name']})

            elif import_type == "inventory":
                item = service.map_to_inventory(record)
                if not item:
                    results["errors"] += 1
                    continue

                existing = await db.execute(
                    select(Inventory).where(
                        Inventory.business_id == current_user.business_id,
                        Inventory.name.ilike(item['name'])
                    )
                )
                existing_item = existing.scalar_one_or_none()

                if existing_item:
                    if conflict_mode == "update":
                        for key, value in item.items():
                            setattr(existing_item, key, value)
                        results["updated"] += 1
                    else:
                        results["items"].append({"action": "skipped", "name": item['name']})
                else:
                    inventory = Inventory(
                        business_id=current_user.business_id,
                        **item
                    )
                    db.add(inventory)
                    results["created"] += 1
                    results["items"].append({"action": "created", "name": item['name']})

            elif import_type == "contacts":
                item = service.map_to_contact(record)
                if not item:
                    results["errors"] += 1
                    continue

                whatsapp = item.get('whatsapp_number')
                if whatsapp:
                    existing = await db.execute(
                        select(Contact).where(
                            Contact.business_id == current_user.business_id,
                            Contact.whatsapp_number == whatsapp
                        )
                    )
                    existing_contact = existing.scalar_one_or_none()

                    if existing_contact:
                        results["items"].append({"action": "skipped", "name": item.get('name', whatsapp)})
                        continue

                contact = Contact(
                    business_id=current_user.business_id,
                    **item
                )
                db.add(contact)
                results["created"] += 1
                results["items"].append({"action": "created", "name": item.get('name', whatsapp)})

        except Exception as e:
            results["errors"] += 1
            results["error_details"].append(f"Linha {idx + 1}: {str(e)}")

    await db.commit()

    return results
