from datetime import datetime, timedelta
from .models import User, Category, Menu, Transaction, TransactionItem
from .security import hash_password


def waktu(menit_lalu):
    awal_hari = datetime.combine(datetime.now().date(), datetime.min.time())
    return max(awal_hari, datetime.now() - timedelta(minutes=menit_lalu))


def isi_data_awal(db):
    """Mengisi data contoh HANYA jika database masih kosong."""
    if db.query(User).count() > 0:
        return
    db.add_all([
        User(username="admin", password_hash=hash_password("admin123"), nama="Admin", role="admin"),
        User(username="kasir", password_hash=hash_password("kasir123"), nama="Kasir", role="kasir"),
    ])
    kategori = {n: Category(nama=n, deskripsi=d) for n, d in [
        ("Coffee", "Minuman berbasis kopi"), ("Non-Coffee", "Minuman tanpa kopi"),
        ("Food", "Makanan utama"), ("Snack", "Camilan dan roti")]}
    db.add_all(kategori.values())
    db.flush()

    data_menu = [  # kategori, nama, deskripsi, tipe, harga, stok, tersedia
        ("Coffee", "Kopi Susu Aren", "Espresso, susu segar, dan gula aren.", "minuman", 18000, 40, True),
        ("Coffee", "Americano", "Espresso dengan air panas.", "minuman", 15000, 50, True),
        ("Coffee", "Cappuccino", "Espresso dengan susu berbusa tebal.", "minuman", 20000, 35, True),
        ("Coffee", "Kopi Tubruk", "Diseduh tubruk, disajikan tanpa disaring.", "minuman", 8000, 60, True),
        ("Coffee", "Kopi Jahe", "Kopi hitam dengan jahe merah.", "minuman", 12000, 6, False),
        ("Non-Coffee", "Matcha Latte", "Matcha dengan susu segar.", "minuman", 22000, 25, True),
        ("Non-Coffee", "Cokelat Dingin", "Cokelat pekat dengan es.", "minuman", 20000, 20, True),
        ("Non-Coffee", "Es Teh Lemon", "Teh dingin dengan perasan lemon.", "minuman", 10000, 45, True),
        ("Food", "Nasi Telur", "Nasi, telur dadar, sambal, kerupuk.", "makanan", 15000, 15, True),
        ("Food", "Indomie Goreng", "Dengan telur dan sawi.", "makanan", 13000, 30, True),
        ("Snack", "Butter Croissant", "Croissant mentega, dipanggang pagi hari.", "makanan", 20000, 0, False),
        ("Snack", "Roti Bakar Cokelat", "Roti tebal, cokelat, dan keju.", "makanan", 16000, 12, True),
        ("Snack", "Pisang Goreng", "Pisang kepok dengan tepung renyah.", "makanan", 12000, 0, False),
    ]
    menu = {}
    for kat, nama, desk, tipe, harga, stok, ada in data_menu:
        menu[nama] = Menu(category_id=kategori[kat].id, nama=nama, deskripsi=desk, tipe=tipe,
                          harga=harga, stok=stok, is_available=ada)
    db.add_all(menu.values())
    db.flush()

    contoh = [  # pelanggan, status, menit lalu, [(menu, qty, catatan)]
        ("Rina", "selesai", 240, [("Kopi Susu Aren", 2, None), ("Butter Croissant", 1, None)]),
        ("Bagas", "selesai", 200, [("Cappuccino", 1, None), ("Roti Bakar Cokelat", 1, None)]),
        ("Sinta", "selesai", 150, [("Matcha Latte", 2, None), ("Kopi Susu Aren", 1, "Less sugar")]),
        ("Fajar", "dibatalkan", 120, [("Kopi Tubruk", 1, None)]),
        ("Dimas", "diproses", 40, [("Indomie Goreng", 1, None), ("Es Teh Lemon", 1, None)]),
        ("Ayu", "pending", 10, [("Kopi Susu Aren", 3, None)]),
        ("Lina", "selesai", 1440 + 300, [("Kopi Susu Aren", 2, None), ("Nasi Telur", 1, None)]),
        ("Toni", "selesai", 2880 + 200, [("Americano", 2, None), ("Roti Bakar Cokelat", 2, None)]),
    ]
    for i, (nama, status, menit, items) in enumerate(contoh, start=1):
        trx = Transaction(kode_transaksi=f"TRX-{i:04d}", nama_pelanggan=nama, status=status, created_at=(
            datetime.now() - timedelta(minutes=menit) if menit > 1440 else waktu(menit)))
        for nama_menu, qty, catatan in items:
            m = menu[nama_menu]
            trx.items.append(TransactionItem(menu_id=m.id, qty=qty, harga_satuan=m.harga,
                                             subtotal=qty * m.harga, catatan=catatan))
        trx.total_harga = sum(x.subtotal for x in trx.items)
        db.add(trx)
    db.commit()
