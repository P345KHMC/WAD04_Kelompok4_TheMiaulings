from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class CategoryIn(BaseModel):
    nama: str = Field(min_length=1, max_length=100)
    deskripsi: Optional[str] = None

class CategoryOut(ORM):
    id: int
    nama: str
    deskripsi: Optional[str] = None


class MenuIn(BaseModel):
    category_id: int
    nama: str = Field(min_length=2, max_length=100)
    deskripsi: Optional[str] = None
    tipe: Literal["makanan", "minuman"]
    harga: float = Field(gt=0)
    stok: int = Field(0, ge=0)
    is_available: bool = True

class AvailabilityIn(BaseModel):
    is_available: bool

class MenuOut(ORM):
    id: int
    category_id: int
    nama: str
    deskripsi: Optional[str] = None
    tipe: str
    harga: float
    stok: int
    foto_url: Optional[str] = None
    is_available: bool
    created_at: datetime
    category: CategoryOut


class ItemIn(BaseModel):
    menu_id: int
    qty: int = Field(gt=0)
    catatan: Optional[str] = Field(None, max_length=255)

class ItemUpdate(BaseModel):
    qty: Optional[int] = Field(None, gt=0)
    catatan: Optional[str] = Field(None, max_length=255)

class TransactionIn(BaseModel):
    nama_pelanggan: str = Field(min_length=1, max_length=100)
    items: list[ItemIn] = Field(min_length=1)

class StatusIn(BaseModel):
    status: Literal["pending", "diproses", "selesai", "dibatalkan"]

class MenuMini(ORM):
    id: int
    nama: str
    tipe: str
    foto_url: Optional[str] = None

class ItemOut(ORM):
    id: int
    transaction_id: int
    menu_id: int
    qty: int
    harga_satuan: float
    subtotal: float
    catatan: Optional[str] = None
    menu: MenuMini

class TransactionOut(ORM):
    id: int
    kode_transaksi: str
    nama_pelanggan: str
    status: str
    total_harga: float
    created_at: datetime
    items: list[ItemOut]


class LoginIn(BaseModel):
    username: str
    password: str

class UserOut(ORM):
    id: int
    username: str
    nama: str
    role: str
