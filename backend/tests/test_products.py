import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.modules.products.models import Product

BASE = "/api/v1/products"
PAYLOAD = {
    "name": "Widget",
    "description": "Un widget",
    "price": "19.99",
    "stock": 5,
    "image_url": "https://example.com/w.png",
}


@pytest.fixture
def make_product(db):
    def _make(name="Producto", price="10.00", stock=3, is_active=True) -> Product:
        product = Product(
            name=name,
            description="desc",
            price=price,
            stock=stock,
            image_url="https://example.com/i.png",
            is_active=is_active,
        )
        db.add(product)
        db.commit()
        return product

    return _make


def test_db_rejects_invalid_price_and_stock(db):
    for price, stock in (("0", 1), ("-1", 1), ("5", -1)):
        with pytest.raises(IntegrityError):
            db.execute(
                text(
                    "INSERT INTO products (name, description, price, stock, image_url) "
                    "VALUES ('x', 'd', :price, :stock, 'u')"
                ),
                {"price": price, "stock": stock},
            )
        db.rollback()


def test_list_is_public_and_only_active(client, make_product):
    make_product("Activo")
    make_product("Inactivo", is_active=False)
    response = client.get(BASE)
    assert response.status_code == 200
    body = response.json()
    assert [item["name"] for item in body["items"]] == ["Activo"]
    assert body["total"] == 1 and body["page"] == 1 and body["page_size"] == 12
    assert body["items"][0]["price"] == "10.00"


def test_include_inactive_ignored_for_visitor_and_client(client, client_session, make_product):
    make_product("Activo")
    make_product("Inactivo", is_active=False)
    for session in (client, client_session):
        assert session.get(BASE, params={"include_inactive": True}).json()["total"] == 1


def test_include_inactive_for_admin(admin_session, make_product):
    make_product("Activo")
    make_product("Inactivo", is_active=False)
    assert admin_session.get(BASE, params={"include_inactive": True}).json()["total"] == 2
    assert admin_session.get(BASE).json()["total"] == 1


def test_invalid_token_does_not_break_public_list(client, make_product):
    make_product()
    response = client.get(BASE, headers={"Authorization": "Bearer garbage"})
    assert response.status_code == 200


def test_search_and_pagination(client, make_product):
    for name in ("Wireless Mouse", "Mechanical Keyboard", "USB Mouse Pad"):
        make_product(name)
    found = client.get(BASE, params={"q": "MOUSE"}).json()
    assert {item["name"] for item in found["items"]} == {"Wireless Mouse", "USB Mouse Pad"}
    page = client.get(BASE, params={"page": 2, "page_size": 2}).json()
    assert page["total"] == 3 and len(page["items"]) == 1
    assert client.get(BASE, params={"q": "%"}).json()["total"] == 0
    assert client.get(BASE, params={"page_size": 101}).status_code == 422


def test_detail_requires_session(client, make_product):
    product = make_product()
    assert client.get(f"{BASE}/{product.id}").status_code == 401


def test_detail_hides_inactive_from_client(client_session, admin_session, make_product):
    product = make_product(is_active=False)
    assert client_session.get(f"{BASE}/{product.id}").status_code == 404
    assert admin_session.get(f"{BASE}/{product.id}").status_code == 200
    assert client_session.get(f"{BASE}/9999").status_code == 404


def test_create_requires_admin(client, client_session):
    assert client.post(BASE, json=PAYLOAD).status_code == 401
    assert client_session.post(BASE, json=PAYLOAD).status_code == 403


def test_admin_crud_flow(admin_session, client_session):
    created = admin_session.post(BASE, json=PAYLOAD)
    assert created.status_code == 201
    product = created.json()
    assert product["price"] == "19.99" and product["is_active"] is True

    patched = admin_session.patch(f"{BASE}/{product['id']}", json={"stock": 0})
    assert patched.status_code == 200 and patched.json()["stock"] == 0
    assert patched.json()["name"] == "Widget"

    replaced = admin_session.put(
        f"{BASE}/{product['id']}", json={**PAYLOAD, "name": "Widget 2", "price": 25}
    )
    assert replaced.status_code == 200
    assert replaced.json()["name"] == "Widget 2" and replaced.json()["price"] == "25.00"

    assert client_session.patch(f"{BASE}/{product['id']}", json={"stock": 1}).status_code == 403
    assert client_session.put(f"{BASE}/{product['id']}", json=PAYLOAD).status_code == 403
    assert client_session.delete(f"{BASE}/{product['id']}").status_code == 403


def test_duplicate_name_conflicts(admin_session, make_product):
    make_product("Existente")
    other = make_product("Otro")
    assert admin_session.post(BASE, json={**PAYLOAD, "name": "Existente"}).status_code == 409
    assert admin_session.patch(f"{BASE}/{other.id}", json={"name": "Existente"}).status_code == 409
    assert (
        admin_session.put(f"{BASE}/{other.id}", json={**PAYLOAD, "name": "Existente"}).status_code
        == 409
    )


def test_validation_errors(admin_session, make_product):
    product = make_product()
    for bad in (
        {**PAYLOAD, "price": "0"},
        {**PAYLOAD, "price": "-5"},
        {**PAYLOAD, "price": "1.999"},
        {**PAYLOAD, "stock": -1},
        {k: v for k, v in PAYLOAD.items() if k != "name"},
    ):
        assert admin_session.post(BASE, json=bad).status_code == 422
    assert admin_session.patch(f"{BASE}/{product.id}", json={}).status_code == 422
    assert admin_session.patch(f"{BASE}/{product.id}", json={"price": None}).status_code == 422
    assert admin_session.patch(f"{BASE}/{product.id}", json={"stock": -2}).status_code == 422


def test_missing_product_404(admin_session):
    assert admin_session.patch(f"{BASE}/9999", json={"stock": 1}).status_code == 404
    assert admin_session.put(f"{BASE}/9999", json=PAYLOAD).status_code == 404
    assert admin_session.delete(f"{BASE}/9999").status_code == 404


def test_delete_is_logical(admin_session, client, make_product, db):
    product = make_product("Borrable")
    assert admin_session.delete(f"{BASE}/{product.id}").status_code == 204
    db.expire_all()
    assert db.get(Product, product.id).is_active is False
    assert client.get(BASE).json()["total"] == 0
    assert admin_session.get(f"{BASE}/{product.id}").json()["is_active"] is False
