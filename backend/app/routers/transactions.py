from datetime import date, datetime, time, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Transaction, TransactionItem, Menu
from ..schemas import TransactionIn, TransactionOut, ItemIn, ItemUpdate, StatusIn
from ..security import get_current_user, require_admin

router = APIRouter(prefix="/api/v1/transactions", tags=["Transaksi"], dependencies=[Depends(get_current_user)])

AKTIF = ("pending", "diproses")  # hanya status ini yang boleh diubah itemnya
ALUR_STATUS = {"pending": ["diproses", "dibatalkan"], "diproses": ["selesai", "dibatalkan"]}


def ambil(db, id):
    trx = db.get(Transaction, id)
    if not trx:
        raise HTTPException(404, "Transaksi tidak ditemukan.")
    return trx


def harus_aktif(trx):
    if trx.status not in AKTIF:
        raise HTTPException(409, f"Transaksi {trx.status} sudah terkunci dan tidak bisa diubah.")


def ubah_stok(menu, delta):
    """delta negatif = stok dipakai, positif = stok dikembalikan."""
    sebelum = menu.stok
    menu.stok = sebelum + delta
    if menu.stok <= 0:
        menu.is_available = False           # stok habis -> otomatis habis
    elif sebelum == 0:
        menu.is_available = True            # stok kembali terisi -> tersedia lagi


def hitung_total(trx):
    trx.total_harga = sum((i.subtotal for i in trx.items), 0)


def tambah_item(db, trx, data: ItemIn):
    menu = db.get(Menu, data.menu_id)
    if not menu:
        raise HTTPException(404, f"Menu dengan id {data.menu_id} tidak ditemukan.")
    if not menu.is_available:
        raise HTTPException(400, f"Menu {menu.nama} sedang tidak tersedia.")
    if menu.stok < data.qty:
        raise HTTPException(400, f"Stok {menu.nama} tidak cukup (sisa {menu.stok}).")
    catatan = (data.catatan or "").strip() or None
    ada = next((i for i in trx.items if i.menu_id == menu.id and i.catatan == catatan), None)
    if ada:  # menu + catatan sama -> gabungkan
        ada.qty += data.qty
        ada.subtotal = ada.qty * ada.harga_satuan
    else:
        trx.items.append(TransactionItem(menu_id=menu.id, qty=data.qty, harga_satuan=menu.harga,
                                         subtotal=data.qty * menu.harga, catatan=catatan))
    ubah_stok(menu, -data.qty)


def kembalikan_stok(trx):
    for item in trx.items:
        ubah_stok(item.menu, item.qty)


@router.post("", response_model=TransactionOut, status_code=201)
def buat_transaksi(data: TransactionIn, db: Session = Depends(get_db)):
    trx = Transaction(nama_pelanggan=data.nama_pelanggan.strip(), status="pending", total_harga=0)
    db.add(trx)
    db.flush()  # agar id tersedia untuk kode transaksi
    trx.kode_transaksi = f"TRX-{trx.id:04d}"
    for item in data.items:
        tambah_item(db, trx, item)
    hitung_total(trx)  # total dihitung otomatis oleh server
    db.commit()
    db.refresh(trx)
    return trx


@router.get("", response_model=list[TransactionOut])
def list_transaksi(status: Optional[str] = None, start_date: Optional[date] = None,
                   end_date: Optional[date] = None, db: Session = Depends(get_db)):
    q = db.query(Transaction)
    if status:
        q = q.filter(Transaction.status == status)
    if start_date:
        q = q.filter(Transaction.created_at >= datetime.combine(start_date, time.min))
    if end_date:
        q = q.filter(Transaction.created_at < datetime.combine(end_date + timedelta(days=1), time.min))
    return q.order_by(Transaction.created_at.desc(), Transaction.id.desc()).all()


@router.get("/{id}", response_model=TransactionOut)
def detail_transaksi(id: int, db: Session = Depends(get_db)):
    return ambil(db, id)


@router.post("/{id}/items", response_model=TransactionOut, status_code=201)
def tambah_item_transaksi(id: int, data: ItemIn, db: Session = Depends(get_db)):
    trx = ambil(db, id)
    harus_aktif(trx)
    tambah_item(db, trx, data)
    hitung_total(trx)
    db.commit()
    db.refresh(trx)
    return trx


def ambil_item(trx, item_id):
    item = next((i for i in trx.items if i.id == item_id), None)
    if not item:
        raise HTTPException(404, "Item tidak ditemukan di transaksi ini.")
    return item


@router.put("/{id}/items/{item_id}", response_model=TransactionOut)
def ubah_item(id: int, item_id: int, data: ItemUpdate, db: Session = Depends(get_db)):
    trx = ambil(db, id)
    harus_aktif(trx)
    item = ambil_item(trx, item_id)
    diubah = data.model_dump(exclude_unset=True)
    if diubah.get("qty") is not None:
        selisih = diubah["qty"] - item.qty
        if selisih > 0 and item.menu.stok < selisih:
            raise HTTPException(400, f"Stok {item.menu.nama} tidak cukup (sisa {item.menu.stok}).")
        ubah_stok(item.menu, -selisih)
        item.qty = diubah["qty"]
        item.subtotal = item.qty * item.harga_satuan
    if "catatan" in diubah:
        item.catatan = (diubah["catatan"] or "").strip() or None
    hitung_total(trx)
    db.commit()
    db.refresh(trx)
    return trx


@router.delete("/{id}/items/{item_id}", response_model=TransactionOut)
def hapus_item(id: int, item_id: int, db: Session = Depends(get_db)):
    trx = ambil(db, id)
    harus_aktif(trx)
    item = ambil_item(trx, item_id)
    if len(trx.items) == 1:
        raise HTTPException(400, "Pesanan minimal punya 1 item. Batalkan pesanan jika tidak jadi.")
    ubah_stok(item.menu, item.qty)
    trx.items.remove(item)
    hitung_total(trx)
    db.commit()
    db.refresh(trx)
    return trx


@router.patch("/{id}/status", response_model=TransactionOut)
def ubah_status(id: int, data: StatusIn, db: Session = Depends(get_db)):
    trx = ambil(db, id)
    if data.status not in ALUR_STATUS.get(trx.status, []):
        raise HTTPException(409, f"Status tidak bisa diubah dari {trx.status} ke {data.status}.")
    if data.status == "dibatalkan":
        kembalikan_stok(trx)
    trx.status = data.status
    db.commit()
    db.refresh(trx)
    return trx


@router.delete("/{id}", status_code=204)
def hapus_transaksi(id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    trx = ambil(db, id)
    if trx.status in AKTIF:
        kembalikan_stok(trx)
    db.delete(trx)
    db.commit()
    return Response(status_code=204)
