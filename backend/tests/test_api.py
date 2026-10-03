import os, tempfile
os.environ["DATABASE_URL"] = "sqlite:///" + os.path.join(tempfile.mkdtemp(), "test.db")
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def login(username, password):
    r = client.post("/api/v1/auth/login", json={"username": username, "password": password})
    assert r.status_code == 200
    return {"Authorization": "Bearer " + r.json()["access_token"]}


admin, kasir = login("admin", "admin123"), login("kasir", "kasir123")


def test_login_salah_dan_tanpa_token():
    assert client.post("/api/v1/auth/login", json={"username": "admin", "password": "x"}).status_code == 401
    assert client.get("/api/v1/menus").status_code == 401


def test_role():
    assert client.get("/api/v1/categories", headers=kasir).status_code == 403
    assert client.get("/api/v1/menus", headers=kasir).status_code == 200
    assert client.get("/api/v1/reports/sales/daily", headers=kasir).status_code == 403
    assert client.get("/api/v1/reports/summary", headers=kasir).status_code == 200


def test_hapus_kategori_dipakai_ditolak():
    r = client.delete("/api/v1/categories/1", headers=admin)
    assert r.status_code == 409 and "masih digunakan oleh 5 menu" in r.json()["detail"]


def test_menu_crud():
    baru = {"category_id": 1, "nama": "Es Kopi Test", "tipe": "minuman", "harga": 17000, "stok": 5}
    r = client.post("/api/v1/menus", json=baru, headers=admin)
    assert r.status_code == 201 and r.json()["category"]["nama"] == "Coffee"
    id = r.json()["id"]
    assert client.post("/api/v1/menus", json=baru, headers=kasir).status_code == 403
    assert client.patch(f"/api/v1/menus/{id}/availability", json={"is_available": False}, headers=kasir).json()["is_available"] is False
    assert client.delete(f"/api/v1/menus/{id}", headers=admin).status_code == 204


def test_alur_transaksi():
    stok_awal = client.get("/api/v1/menus/2", headers=kasir).json()["stok"]
    r = client.post("/api/v1/transactions", headers=kasir, json={"nama_pelanggan": "Uji", "items": [{"menu_id": 2, "qty": 2}]})
    assert r.status_code == 201
    trx = r.json()
    assert trx["total_harga"] == 30000 and trx["status"] == "pending"
    assert client.get("/api/v1/menus/2", headers=kasir).json()["stok"] == stok_awal - 2
    # menu tidak tersedia ditolak
    assert client.post(f"/api/v1/transactions/{trx['id']}/items", json={"menu_id": 5, "qty": 1}, headers=kasir).status_code == 400
    # ubah qty -> total ikut berubah
    item_id = trx["items"][0]["id"]
    r = client.put(f"/api/v1/transactions/{trx['id']}/items/{item_id}", json={"qty": 3}, headers=kasir)
    assert r.json()["total_harga"] == 45000
    # batalkan -> stok kembali, lalu terkunci
    assert client.patch(f"/api/v1/transactions/{trx['id']}/status", json={"status": "dibatalkan"}, headers=kasir).status_code == 200
    assert client.get("/api/v1/menus/2", headers=kasir).json()["stok"] == stok_awal
    assert client.put(f"/api/v1/transactions/{trx['id']}/items/{item_id}", json={"qty": 1}, headers=kasir).status_code == 409
    assert client.patch(f"/api/v1/transactions/{trx['id']}/status", json={"status": "selesai"}, headers=kasir).status_code == 409


def test_laporan_dan_export():
    r = client.get("/api/v1/reports/summary", headers=admin).json()
    assert r["total_penjualan"] > 0 and len(r["menu_terlaris"]) > 0
    assert len(client.get("/api/v1/reports/best-sellers?limit=2", headers=admin).json()) == 2
    assert client.get("/api/v1/reports/sales-by-category", headers=admin).json()[0]["kategori"]
    assert client.get("/api/v1/reports/sales/monthly", headers=admin).status_code == 200
    assert client.get("/api/v1/reports/export?format=xlsx", headers=admin).content[:2] == b"PK"
    assert client.get("/api/v1/reports/export?format=pdf", headers=admin).content[:4] == b"%PDF"


def test_logout_mencabut_token():
    t = login("kasir", "kasir123")
    assert client.post("/api/v1/auth/logout", headers=t).status_code == 200
    assert client.get("/api/v1/auth/me", headers=t).status_code == 401
