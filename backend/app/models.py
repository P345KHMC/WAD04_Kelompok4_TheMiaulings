from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from .database import Base


class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True)
    nama = Column(String(100), nullable=False, unique=True)
    deskripsi = Column(Text)
    menus = relationship("Menu", back_populates="category")


class Menu(Base):
    __tablename__ = "menus"
    __table_args__ = (CheckConstraint("tipe IN ('makanan','minuman')", name="ck_menu_tipe"),)
    id = Column(Integer, primary_key=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    nama = Column(String(100), nullable=False)
    deskripsi = Column(Text)
    tipe = Column(String(20), nullable=False)
    harga = Column(Numeric(10, 2), nullable=False)
    stok = Column(Integer, nullable=False, default=0)
    foto_url = Column(String(255))
    is_available = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.now)
    category = relationship("Category", back_populates="menus")


class Transaction(Base):
    __tablename__ = "transactions"
    __table_args__ = (CheckConstraint("status IN ('pending','diproses','selesai','dibatalkan')", name="ck_trx_status"),)
    id = Column(Integer, primary_key=True)
    kode_transaksi = Column(String(30), unique=True)
    nama_pelanggan = Column(String(100), nullable=False)
    status = Column(String(20), nullable=False, default="pending")
    total_harga = Column(Numeric(12, 2), nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.now)
    items = relationship("TransactionItem", back_populates="transaction",
                         cascade="all, delete-orphan", order_by="TransactionItem.id")


class TransactionItem(Base):
    __tablename__ = "transaction_items"
    id = Column(Integer, primary_key=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)
    menu_id = Column(Integer, ForeignKey("menus.id"), nullable=False)
    qty = Column(Integer, nullable=False)
    harga_satuan = Column(Numeric(10, 2), nullable=False)  # harga saat dipesan
    subtotal = Column(Numeric(12, 2), nullable=False)      # qty x harga_satuan
    catatan = Column(String(255))
    transaction = relationship("Transaction", back_populates="items")
    menu = relationship("Menu")


# CATATAN: tabel ini TIDAK ada di ERD, tetapi dibutuhkan untuk login (admin/kasir).
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String(50), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    nama = Column(String(100), nullable=False)
    role = Column(String(20), nullable=False)  # admin / kasir
