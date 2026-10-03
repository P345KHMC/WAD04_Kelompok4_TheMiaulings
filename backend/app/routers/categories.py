from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Category, Menu
from ..schemas import CategoryIn, CategoryOut
from ..security import require_admin

# Semua endpoint kategori khusus admin (sesuai dokumen API).
router = APIRouter(prefix="/api/v1/categories", tags=["Kategori"], dependencies=[Depends(require_admin)])


def ambil(db, id):
    kategori = db.get(Category, id)
    if not kategori:
        raise HTTPException(404, "Kategori tidak ditemukan.")
    return kategori


def cek_nama_unik(db, nama, id_sendiri=None):
    ada = db.query(Category).filter(Category.nama == nama.strip()).first()
    if ada and ada.id != id_sendiri:
        raise HTTPException(409, f"Kategori \"{nama}\" sudah ada.")


@router.get("", response_model=list[CategoryOut])
def list_kategori(db: Session = Depends(get_db)):
    return db.query(Category).order_by(Category.id).all()


@router.get("/{id}", response_model=CategoryOut)
def detail_kategori(id: int, db: Session = Depends(get_db)):
    return ambil(db, id)


@router.post("", response_model=CategoryOut, status_code=201)
def tambah_kategori(data: CategoryIn, db: Session = Depends(get_db)):
    cek_nama_unik(db, data.nama)
    kategori = Category(nama=data.nama.strip(), deskripsi=data.deskripsi)
    db.add(kategori)
    db.commit()
    db.refresh(kategori)
    return kategori


@router.put("/{id}", response_model=CategoryOut)
def ubah_kategori(id: int, data: CategoryIn, db: Session = Depends(get_db)):
    kategori = ambil(db, id)
    cek_nama_unik(db, data.nama, id)
    kategori.nama, kategori.deskripsi = data.nama.strip(), data.deskripsi
    db.commit()
    db.refresh(kategori)
    return kategori


@router.delete("/{id}", status_code=204)
def hapus_kategori(id: int, db: Session = Depends(get_db)):
    kategori = ambil(db, id)
    jumlah = db.query(Menu).filter(Menu.category_id == id).count()
    if jumlah > 0:  # ditolak jika masih dipakai menu
        raise HTTPException(409, f"Kategori {kategori.nama} masih digunakan oleh {jumlah} menu.")
    db.delete(kategori)
    db.commit()
    return Response(status_code=204)
