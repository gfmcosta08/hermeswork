from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List, Optional

from app.database import get_db
from app.models.models import Product, ProductComponent, PropertyFeature, User
from app.schemas.schemas import (
    ProductCreate, ProductUpdate, ProductResponse,
    ProductComponentCreate, ProductComponentResponse,
    PropertyFeatureCreate, PropertyFeatureResponse
)
from app.core.deps import get_current_user

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=List[ProductResponse])
async def list_products(
    type: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Product).where(Product.business_id == current_user.business_id)

    if type:
        query = query.where(Product.type == type)
    if category:
        query = query.where(Product.category == category)
    if active is not None:
        query = query.where(Product.active == active)
    if search:
        query = query.where(Product.name.ilike(f"%{search}%"))

    result = await db.execute(query.order_by(Product.created_at.desc()))
    products = result.scalars().all()

    return products


@router.post("", response_model=ProductResponse)
async def create_product(
    product_data: ProductCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    product = Product(
        **product_data.model_dump(),
        business_id=current_user.business_id
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)

    return product


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: UUID,
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

    return product


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: UUID,
    product_data: ProductUpdate,
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

    update_data = product_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)

    await db.commit()
    await db.refresh(product)

    return product


@router.delete("/{product_id}")
async def delete_product(
    product_id: UUID,
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

    product.active = False
    await db.commit()

    return {"message": "Produto desativado"}


@router.get("/{product_id}/components", response_model=List[ProductComponentResponse])
async def list_product_components(
    product_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(ProductComponent).where(ProductComponent.product_id == product_id)
    )
    components = result.scalars().all()
    return components


@router.post("/{product_id}/components", response_model=ProductComponentResponse)
async def create_product_component(
    product_id: UUID,
    component_data: ProductComponentCreate,
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

    component = ProductComponent(
        **component_data.model_dump()
    )
    db.add(component)
    await db.commit()
    await db.refresh(component)

    return component


@router.delete("/{product_id}/components/{component_id}")
async def delete_product_component(
    product_id: UUID,
    component_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(ProductComponent).where(
            ProductComponent.id == component_id,
            ProductComponent.product_id == product_id
        )
    )
    component = result.scalar_one_or_none()
    if not component:
        raise HTTPException(status_code=404, detail="Componente não encontrado")

    await db.delete(component)
    await db.commit()

    return {"message": "Componente removido"}


@router.get("/{product_id}/features", response_model=List[PropertyFeatureResponse])
async def list_property_features(
    product_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(PropertyFeature).where(PropertyFeature.product_id == product_id)
    )
    features = result.scalars().all()
    return features


@router.post("/{product_id}/features", response_model=PropertyFeatureResponse)
async def create_property_feature(
    product_id: UUID,
    feature_data: PropertyFeatureCreate,
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

    feature = PropertyFeature(
        **feature_data.model_dump()
    )
    db.add(feature)
    await db.commit()
    await db.refresh(feature)

    return feature


@router.delete("/{product_id}/features/{feature_id}")
async def delete_property_feature(
    product_id: UUID,
    feature_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(PropertyFeature).where(
            PropertyFeature.id == feature_id,
            PropertyFeature.product_id == product_id
        )
    )
    feature = result.scalar_one_or_none()
    if not feature:
        raise HTTPException(status_code=404, detail="Feature não encontrado")

    await db.delete(feature)
    await db.commit()

    return {"message": "Feature removida"}
