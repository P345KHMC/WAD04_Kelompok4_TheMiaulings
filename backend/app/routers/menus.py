import os, uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Response, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models import Menu, Category, TransactionItem
from ..schemas import MenuIn, MenuOut, AvailabilityIn
from ..security import get_current_user, require_admin

router = APIRouter(prefix="/api/v1/menus", tags=["Menu"])
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
TIPE_FOTO = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}


def ambil(db, id):
    menu = db.get(Menu, id)
    if not menu:
        raise HTTPException(404, "Menu tidak ditemukan.")
    return menu


def cek_kategori(db, category_id):
    if not db.get(Category, category_id):
        raise HTTPException(400, "Kategori tidak ditemukan.")


def hapus_file_foto(foto_url):
    if foto_url:
        path = os.path.join(UPLOAD_DIR, os.path.basename(foto_url))
        if os.path.exists(path):
            os.remove(path)


@router.get("", response_model=list[MenuOut])
def list_menu(category_id: Optional[int] = None, tipe: Optional[str] = None, search: Optional[str] = None,
              is_available: Optional[bool] = None, db: Session = Depends(get_db), _=Depends(get_current_user)):
    q = db.query(Menu).options(joinedload(Menu.category))
    if category_id:
        q = q.filter(Menu.category_id == category_id)
    if tipe:
        q = q.filter(Menu.tipe == tipe)
    if search:
        q = q.filter(Menu.nama.ilike(f"%{search}%"))
    if is_available is not None:
        q = q.filter(Menu.is_available == is_available)
    return q.order_by(Menu.id).all()


@router.get("/{id}", response_model=MenuOut)
def detail_menu(id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return ambil(db, id)


@router.post("", response_model=MenuOut, status_code=201)
def tambah_menu(data: MenuIn, db: Session = Depends(get_db), _=Depends(require_admin)):
    cek_kategori(db, data.category_id)
    menu = Menu(**data.model_dump())
    db.add(menu)
    db.commit()
    db.refresh(menu)
    return menu


@router.put("/{id}", response_model=MenuOut)
def ubah_menu(id: int, data: MenuIn, db: Session = Depends(get_db), _=Depends(require_admin)):
    menu = ambil(db, id)
    cek_kategori(db, data.category_id)
    for kolom, nilai in data.model_dump().items():
        setattr(menu, kolom, nilai)
    db.commit()
    db.refresh(menu)
    return menu


# Admin dan kasir boleh menandai menu tersedia/habis (asumsi: berguna saat bar sibuk).
@router.patch("/{id}/availability", response_model=MenuOut)
def ubah_ketersediaan(id: int, data: AvailabilityIn, db: Session = Depends(get_db), _=Depends(get_current_user)):
    menu = ambil(db, id)
    menu.is_available = data.is_available
    db.commit()
    db.refresh(menu)
    return menu


@router.post("/{id}/photo", response_model=MenuOut)
async def upload_foto(id: int, file: UploadFile = File(...), db: Session = Depends(get_db), _=Depends(require_admin)):
    menu = ambil(db, id)
    if file.content_type not in TIPE_FOTO:
        raise HTTPException(400, "Foto harus berformat JPG, PNG, atau WEBP.")
    isi = await file.read()
    if len(isi) > 2 * 1024 * 1024:
        raise HTTPException(400, "Ukuran foto maksimal 2 MB.")
    nama_file = f"menu-{id}-{uuid.uuid4().hex[:8]}{TIPE_FOTO[file.content_type]}"
    with open(os.path.join(UPLOAD_DIR, nama_file), "wb") as f:
        f.write(isi)
    hapus_file_foto(menu.foto_url)
    menu.foto_url = f"/uploads/{nama_file}"
    db.commit()
    db.refresh(menu)
    return menu


@router.delete("/{id}", status_code=204)
def hapus_menu(id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    menu = ambil(db, id)
    if db.query(TransactionItem).filter(TransactionItem.menu_id == id).count() > 0:
        raise HTTPException(409, f"Menu {menu.nama} sudah pernah dipesan dan tidak bisa dihapus. Tandai sebagai habis saja.")
    hapus_file_foto(menu.foto_url)
    db.delete(menu)
    db.commit()
    return Response(status_code=204)
