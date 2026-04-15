from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List
import json

from app.database import get_db
from app.models.models import Product, PropertyFeature, Contact, User
from app.core.deps import get_current_user

router = APIRouter(prefix="/search", tags=["search"])

security = HTTPBearer()


@router.get("/properties")
async def search_properties(
    query: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Product).where(
            Product.business_id == current_user.business_id,
            Product.type == "imovel",
            Product.active == True
        )
    )
    products = list(result.scalars().all())

    features_result = await db.execute(
        select(PropertyFeature).where(
            PropertyFeature.product_id.in_([p.id for p in products])
        )
    )
    features_by_product = {}
    for f in features_result.scalars().all():
        if f.product_id not in features_by_product:
            features_by_product[f.product_id] = []
        features_by_product[f.product_id].append(f)

    query_lower = query.lower()
    query_words = query_lower.split()

    scored_products = []
    for product in products:
        score = 0
        product_features = features_by_product.get(product.id, [])

        feature_dict = {f.key: f.value for f in product_features}
        feature_text = " ".join([f"{k} {v}" for k, v in feature_dict.items()]).lower()

        if any(word in product.name.lower() for word in query_words):
            score += 5
        if any(word in (product.category or "").lower() for word in query_words):
            score += 3
        if any(word in feature_text for word in query_words):
            score += 2
        if any(word in (product.description or "").lower() for word in query_words):
            score += 1

        if score > 0:
            scored_products.append({
                "product": product,
                "features": product_features,
                "score": score
            })

    scored_products.sort(key=lambda x: x["score"], reverse=True)

    return [
        {
            "id": str(sp["product"].id),
            "name": sp["product"].name,
            "price": str(sp["product"].price),
            "category": sp["product"].category,
            "status": sp["product"].metadata.get("status", "disponivel"),
            "features": {f.key: f.value for f in sp["features"]},
            "score": sp["score"]
        }
        for sp in scored_products[:10]
    ]
