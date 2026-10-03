import calendar, io
from datetime import date, datetime, time, timedelta
from typing import Literal, Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models import Transaction, TransactionItem, Menu
from ..security import get_current_user, require_admin

router = APIRouter(prefix="/api/v1/reports", tags=["Laporan"])
# Aturan: penjualan hanya dihitung dari transaksi berstatus "selesai".


def transaksi_selesai(db, start=None, end=None):
    q = (db.query(Transaction).filter(Transaction.status == "selesai")
         .options(joinedload(Transaction.items).joinedload(TransactionItem.menu).joinedload(Menu.category)))
    if start:
        q = q.filter(Transaction.created_at >= datetime.combine(start, time.min))
    if end:
        q = q.filter(Transaction.created_at < datetime.combine(end + timedelta(days=1), time.min))
    return q.all()


def ringkas(trs):
    return {"jumlah_transaksi": len(trs), "total_penjualan": float(sum((t.total_harga for t in trs), 0))}


def per_hari(trs):
    hari = {}
    for t in trs:
        k = t.created_at.date().isoformat()
        d = hari.setdefault(k, {"tanggal": k, "jumlah_transaksi": 0, "total_penjualan": 0.0})
        d["jumlah_transaksi"] += 1
        d["total_penjualan"] += float(t.total_harga)
    return [hari[k] for k in sorted(hari)]


def terlaris(trs, limit):
    a = {}
    for t in trs:
        for i in t.items:
            d = a.setdefault(i.menu_id, {"menu_id": i.menu_id, "nama": i.menu.nama, "tipe": i.menu.tipe,
                                         "foto_url": i.menu.foto_url, "qty": 0, "total": 0.0})
            d["qty"] += i.qty
            d["total"] += float(i.subtotal)
    return sorted(a.values(), key=lambda x: (-x["qty"], x["nama"]))[:limit]


def per_kategori(trs):
    a = {}
    for t in trs:
        for i in t.items:
            c = i.menu.category
            d = a.setdefault(c.id, {"category_id": c.id, "kategori": c.nama, "qty": 0, "total": 0.0})
            d["qty"] += i.qty
            d["total"] += float(i.subtotal)
    return sorted(a.values(), key=lambda x: -x["total"])


@router.get("/summary")  # dipakai Dashboard, jadi admin & kasir boleh
def summary(db: Session = Depends(get_db), _=Depends(get_current_user)):
    hari_ini = date.today()
    trs = transaksi_selesai(db, hari_ini, hari_ini)
    awal = datetime.combine(hari_ini, time.min)
    jumlah = (db.query(Transaction).filter(Transaction.created_at >= awal, Transaction.status != "dibatalkan").count())
    return {"tanggal": hari_ini.isoformat(), "total_penjualan": ringkas(trs)["total_penjualan"],
            "jumlah_transaksi": jumlah, "menu_terlaris": terlaris(trs, 3)}


@router.get("/sales/daily")
def sales_daily(date_: Optional[date] = Query(None, alias="date"), db: Session = Depends(get_db), _=Depends(require_admin)):
    tgl = date_ or date.today()
    return {"tanggal": tgl.isoformat(), **ringkas(transaksi_selesai(db, tgl, tgl))}


@router.get("/sales/monthly")
def sales_monthly(month: Optional[int] = Query(None, ge=1, le=12), year: Optional[int] = None,
                  db: Session = Depends(get_db), _=Depends(require_admin)):
    sekarang = date.today()
    bulan, tahun = month or sekarang.month, year or sekarang.year
    awal, akhir = date(tahun, bulan, 1), date(tahun, bulan, calendar.monthrange(tahun, bulan)[1])
    trs = transaksi_selesai(db, awal, akhir)
    return {"bulan": bulan, "tahun": tahun, **ringkas(trs), "harian": per_hari(trs)}


@router.get("/sales")
def sales_range(start_date: date, end_date: date, db: Session = Depends(get_db), _=Depends(require_admin)):
    trs = transaksi_selesai(db, start_date, end_date)
    return {"start_date": start_date.isoformat(), "end_date": end_date.isoformat(), **ringkas(trs), "harian": per_hari(trs)}


@router.get("/best-sellers")
def best_sellers(limit: int = Query(5, ge=1, le=50), start_date: Optional[date] = None, end_date: Optional[date] = None,
                 db: Session = Depends(get_db), _=Depends(require_admin)):
    return terlaris(transaksi_selesai(db, start_date, end_date), limit)


@router.get("/sales-by-category")
def sales_by_category(start_date: Optional[date] = None, end_date: Optional[date] = None,
                      db: Session = Depends(get_db), _=Depends(require_admin)):
    return per_kategori(transaksi_selesai(db, start_date, end_date))


@router.get("/export")
def export(format: Literal["pdf", "xlsx"], start_date: Optional[date] = None, end_date: Optional[date] = None,
           db: Session = Depends(get_db), _=Depends(require_admin)):
    hari_ini = date.today()
    start, end = start_date or hari_ini.replace(day=1), end_date or hari_ini
    trs = transaksi_selesai(db, start, end)
    judul = f"Laporan Penjualan Warkop Kita {start} s/d {end}"
    r = ringkas(trs)
    bagian = [
        ("Ringkasan", ["Keterangan", "Nilai"], [["Total penjualan", r["total_penjualan"]], ["Jumlah transaksi", r["jumlah_transaksi"]]]),
        ("Penjualan harian", ["Tanggal", "Transaksi", "Penjualan"], [[d["tanggal"], d["jumlah_transaksi"], d["total_penjualan"]] for d in per_hari(trs)]),
        ("Menu terlaris", ["Menu", "Terjual", "Total"], [[d["nama"], d["qty"], d["total"]] for d in terlaris(trs, 10)]),
        ("Penjualan per kategori", ["Kategori", "Terjual", "Total"], [[d["kategori"], d["qty"], d["total"]] for d in per_kategori(trs)]),
    ]
    nama_file = f"laporan-{start}-{end}.{format}"
    header = {"Content-Disposition": f'attachment; filename="{nama_file}"'}

    if format == "xlsx":
        from openpyxl import Workbook
        wb = Workbook()
        wb.remove(wb.active)
        for nama, kolom, baris in bagian:
            ws = wb.create_sheet(nama[:30])
            ws.append([judul])
            ws.append(kolom)
            for b in baris:
                ws.append(b)
        buf = io.BytesIO()
        wb.save(buf)
        return Response(buf.getvalue(), headers=header,
                        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer
    stil = getSampleStyleSheet()
    isi = [Paragraph(judul, stil["Title"])]
    for nama, kolom, baris in bagian:
        tabel = Table([kolom] + (baris or [["-"] * len(kolom)]))
        tabel.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e4d6c2")),
                                   ("GRID", (0, 0), (-1, -1), 0.3, colors.grey)]))
        isi += [Paragraph(nama, stil["Heading3"]), tabel, Spacer(1, 12)]
    buf = io.BytesIO()
    SimpleDocTemplate(buf).build(isi)
    return Response(buf.getvalue(), headers=header, media_type="application/pdf")
